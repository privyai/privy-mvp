import { authenticateToken, getTokenFromRequest } from "@/lib/auth/token-auth";
import { getChatById, getMessagesDecrypted } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { convertToUIMessages } from "@/lib/utils";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get("chatId");

        if (!chatId) {
            return new ChatSDKError("bad_request:api", "chatId is required").toResponse();
        }

        // Authenticate user
        const user = await authenticateToken(request);
        if (!user) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Get raw token for decryption
        const rawToken = getTokenFromRequest(request);
        if (!rawToken) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Verify chat ownership
        const chat = await getChatById({ id: chatId });
        if (!chat || chat.userId !== user.id) {
            return new ChatSDKError("forbidden:chat").toResponse();
        }

        // Get and decrypt messages
        const messages = await getMessagesDecrypted({
            id: chatId,
            rawToken,
            userId: user.id,
        });

        // Convert to UI format
        const uiMessages = convertToUIMessages(messages);

        return Response.json(uiMessages);
    } catch (error) {
        if (error instanceof ChatSDKError) {
            return error.toResponse();
        }
        console.error("Messages API error:", error);
        return new ChatSDKError("bad_request:api", "Failed to fetch messages").toResponse();
    }
}
