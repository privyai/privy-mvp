import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
  UI_MESSAGE_STREAM_HEADERS,
} from "ai";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import { authenticateToken } from "@/lib/auth/token-auth";
import { hashToken } from "@/lib/auth/token";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  FREE_USER_CHAT_LIMIT,
  getChatById,
  getChatCountByUserId,
  getMessageCountByUserId,
  getMessagesByChatId,
  getUserSettings,
  isPremiumUser,
  saveChat,
  saveMemory,
  saveMessages,
  searchMemories,
  updateChatTitleById,
  updateMessage,
} from "@/lib/db/queries";
import { generateConversationSummary } from "@/lib/ai/embeddings";
import type { DBMessage } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { logfire, logRateLimitCheck, logError } from "@/lib/observability/logfire";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    // Zero-trust token authentication
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const messageCount = await getMessageCountByUserId({
      id: user.id,
      differenceInHours: 24,
    });

    // Check if user has premium access (premium or active trial)
    const hasPremium = await isPremiumUser(user.id);

    // Premium users have unlimited messages, free users capped at 50/day
    const maxMessages = hasPremium ? Number.POSITIVE_INFINITY : 50;
    const isAllowed = messageCount <= maxMessages;

    // Log rate limit check to Logfire (with hashed user ID for privacy)
    logRateLimitCheck({
      userId: hashToken(user.id), // Hash user ID before logging
      messageCount,
      limit: hasPremium ? -1 : 50, // -1 indicates unlimited
      allowed: isAllowed,
    });

    if (!isAllowed) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    // Check if this is a tool approval flow (all messages sent)
    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
      // Only fetch messages if chat already exists and not tool approval
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === "user") {
      // Check chat limit for new conversations (premium users unlimited)
      const chatCount = await getChatCountByUserId({ userId: user.id });

      if (!hasPremium && chatCount >= FREE_USER_CHAT_LIMIT) {
        return new ChatSDKError("rate_limit:chat", "You have reached the maximum number of chats (10) allowed on the free plan. Upgrade to Premium for unlimited chats.").toResponse();
      }

      // Save chat immediately with placeholder title
      await saveChat({
        id,
        userId: user.id,
        title: "New chat",
        visibility: selectedVisibilityType,
      });

      // Start title generation in parallel (don't await)
      titlePromise = generateTitleFromUserMessage({ message });
    }

    // Use all messages for tool approval, otherwise DB messages + new message
    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    // Privacy: No geolocation tracking
    const requestHints: RequestHints = {
      longitude: undefined,
      latitude: undefined,
      city: undefined,
      country: undefined,
    };

    // Only save user messages to the database (not tool approval responses)
    if (message?.role === "user") {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    // Global Memory: Get user settings for premium users (used in execute and onFinish)
    const userSettings = hasPremium ? await getUserSettings(user.id) : null;
    const globalMemoryEnabled = !userSettings || userSettings.globalMemoryEnabled;

    const stream = createUIMessageStream({
      // Pass original messages for tool approval continuation
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        // Handle title generation in parallel
        if (titlePromise) {
          titlePromise.then((title) => {
            updateChatTitleById({ chatId: id, title });
            dataStream.write({ type: "data-chat-title", data: title });
          });
        }

        // Models that output reasoning_content instead of content
        // MiniMax-M2.1 does NOT output reasoning_content - standard content streaming
        const isReasoningModel =
          selectedChatModel.includes("reasoning") ||
          selectedChatModel.includes("thinking") ||
          selectedChatModel.includes("deepseek-r1") ||
          selectedChatModel.includes("glm-4");

        const actualModelId = selectedChatModel.startsWith("mode-")
          ? "accounts/fireworks/models/minimax-m2p1"
          : selectedChatModel;

        // Global Memory: Retrieve relevant memories for premium users (simple text search)
        let memoryContext = "";

        if (hasPremium && globalMemoryEnabled && message?.role === "user") {
          try {
            // Extract text from user message for keyword search
            const userText = message.parts
              ?.filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join(" ") || "";

            if (userText.length > 10) {
              // Simple hybrid search: keywords + recency (no vector embeddings - fast)
              const memories = await searchMemories(user.id, userText, 3);

              if (memories.length > 0) {
                memoryContext = `\n\n[CONTEXT FROM PREVIOUS SESSIONS]
The user has shared these insights in past conversations:
${memories.map((m) => `- ${m.content}`).join("\n")}
[END CONTEXT]

Use this context naturally to provide more personalized coaching. Don't explicitly reference "previous sessions" unless relevant.\n`;
              }
            }
          } catch (memError) {
            console.error("Memory retrieval error (non-blocking):", memError);
            // Non-blocking - continue without memory context
          }
        }

        const result = streamText({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: getLanguageModel(actualModelId) as any,
          system: systemPrompt({ selectedChatModel, requestHints }) + memoryContext,
          messages: await convertToModelMessages(uiMessages),
          temperature: 0.65,
          presencePenalty: 0.1,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : [
              "getWeather",
              "createDocument",
              "updateDocument",
              "requestSuggestions",
            ],
          // No smoothStream - enable direct async streaming without buffering
          experimental_transform: undefined,
          tools: {
            getWeather,
            createDocument: createDocument({
              session: { user: { id: user.id } } as any,
              dataStream
            }),
            updateDocument: updateDocument({
              session: { user: { id: user.id } } as any,
              dataStream
            }),
            requestSuggestions: requestSuggestions({
              session: { user: { id: user.id } } as any,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        // Don't pre-consume stream - let it flow directly to client for true async streaming
        // result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true, // Show thinking process
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (isToolApprovalFlow) {
          // For tool approval, update existing messages (tool state changed) and save new ones
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              // Update existing message with new parts (tool state changed)
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              // Save new message
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          // Normal flow - save all finished messages
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }

        // Global Memory: Save conversation summary for premium users (simple text, no embeddings)
        if (hasPremium && globalMemoryEnabled && finishedMessages.length >= 2) {
          try {
            // Extract text from messages for summary
            const conversationMessages = finishedMessages.map((m) => ({
              role: m.role,
              content: m.parts?.filter((p: any) => p.type === "text").map((p: any) => p.text).join(" ") || "",
            })).filter((m) => m.content.length > 0);

            if (conversationMessages.length >= 2) {
              // Generate summary (using OpenAI for summarization only - no embeddings)
              const summary = await generateConversationSummary(conversationMessages);

              if (summary && summary.length > 10) {
                // Calculate expiry based on user settings
                let expiresAt: Date | undefined;
                if (userSettings?.autoVanishEnabled && userSettings.autoVanishDays > 0) {
                  expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + userSettings.autoVanishDays);
                }

                await saveMemory({
                  userId: user.id,
                  chatId: id,
                  content: summary,
                  contentType: "insight",
                  expiresAt,
                });
              }
            }
          } catch (memSaveError) {
            console.error("Memory save error (non-blocking):", memSaveError);
            // Non-blocking - don't fail the response
          }
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    const streamContext = getStreamContext();

    if (streamContext) {
      try {
        const resumableStream = await streamContext.resumableStream(
          streamId,
          () => stream.pipeThrough(new JsonToSseTransformStream())
        );
        if (resumableStream) {
          return new Response(resumableStream, {
            headers: UI_MESSAGE_STREAM_HEADERS,
          });
        }
      } catch (error) {
        console.error("Failed to create resumable stream:", error);
      }
    }

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const user = await authenticateToken(request);

  if (!user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
