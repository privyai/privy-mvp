import "server-only";
import type { DBMessage } from "@/lib/db/schema";
import { searchMemories, getRecentMemories, saveMemory } from "@/lib/db/queries";

const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1";
const FAST_MODEL = "accounts/fireworks/models/llama-v3p1-8b-instruct";

/**
 * Context Compactor for Privy
 *
 * Implements Claude Code-style conversation compacting:
 * - Recent messages kept in full detail
 * - Older conversations summarized into compact insights
 * - No embeddings/RAG - simple text-based retrieval
 *
 * This approach:
 * - Keeps context window manageable
 * - Preserves important details
 * - Works without vector databases
 */

const MAX_RECENT_MESSAGES = 50; // Keep last N messages in full detail
const MAX_CONTEXT_TOKENS = 4000; // Approximate token budget for memory context
const COMPACTION_THRESHOLD = 100; // Trigger compaction after N messages

export interface CompactedContext {
  /** Recent messages from current chat (full detail) */
  recentMessages: DBMessage[];
  /** Compacted insights from older conversations */
  historySummary: string;
  /** User profile facts extracted from history */
  userProfile: string | null;
  /** Total messages in current chat */
  totalMessages: number;
}

export interface ContextMessage {
  role: string;
  content: string;
}

/**
 * Build compacted context for AI
 * Combines recent messages with summarized history
 */
export async function buildCompactedContext(
  userId: string,
  currentMessages: DBMessage[],
  options: {
    maxRecentMessages?: number;
    includeHistory?: boolean;
  } = {}
): Promise<CompactedContext> {
  const { maxRecentMessages = MAX_RECENT_MESSAGES, includeHistory = true } =
    options;

  // 1. Get recent messages from current chat (full detail)
  const recentMessages = currentMessages.slice(-maxRecentMessages);

  // 2. Build history summary from stored memories
  let historySummary = "";
  let userProfile: string | null = null;

  if (includeHistory) {
    try {
      // Get most recent memories (insights from past conversations)
      const memories = await getRecentMemories(userId, 10);

      if (memories.length > 0) {
        // Separate profile facts from conversation insights
        const profileFacts = memories.filter(
          (m) => m.contentType === "profile"
        );
        const insights = memories.filter((m) => m.contentType !== "profile");

        // Build user profile
        if (profileFacts.length > 0) {
          userProfile = profileFacts.map((m) => `- ${m.content}`).join("\n");
        }

        // Build history summary
        if (insights.length > 0) {
          historySummary = insights.map((m) => `- ${m.content}`).join("\n");
        }
      }
    } catch (error) {
      console.error("Failed to load history context:", error);
      // Non-blocking - continue without history
    }
  }

  return {
    recentMessages,
    historySummary,
    userProfile,
    totalMessages: currentMessages.length,
  };
}

/**
 * Format compacted context for injection into system prompt
 */
export function formatContextForPrompt(context: CompactedContext): string {
  const parts: string[] = [];

  // Add user profile if available
  if (context.userProfile) {
    parts.push(`[USER PROFILE]
Key facts about this user:
${context.userProfile}
[END USER PROFILE]`);
  }

  // Add history summary if available
  if (context.historySummary) {
    parts.push(`[CONVERSATION HISTORY]
Insights from previous sessions:
${context.historySummary}
[END CONVERSATION HISTORY]`);
  }

  if (parts.length === 0) {
    return "";
  }

  return (
    "\n\n" +
    parts.join("\n\n") +
    "\n\nUse this context naturally. Don't explicitly reference 'previous sessions' unless relevant.\n"
  );
}

/**
 * Format all chat summaries for cross-chat context injection
 * Creates a list of chats the AI can reference explicitly
 */
export function formatChatSummariesForPrompt(
  chatSummaries: Array<{ chatId: string; title: string; summary: string | null; createdAt: Date }>,
  currentChatId: string
): string {
  // Filter out current chat and chats with no useful title
  const otherChats = chatSummaries.filter(
    (c) => c.chatId !== currentChatId && c.title && c.title !== "New chat"
  );

  if (otherChats.length === 0) {
    return "";
  }

  // Format each chat with relative time
  const now = new Date();
  const chatLines = otherChats.slice(0, 10).map((c) => {
    const daysAgo = Math.floor((now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;
    const summaryPart = c.summary ? `: ${c.summary}` : "";
    return `- **${c.title}** (${timeLabel})${summaryPart}`;
  }).join("\n");

  return `

[USER'S CONVERSATION HISTORY]
You have access to context from the user's other conversations:

${chatLines}

When relevant, you can reference these by saying "In your chat about [Title]..." or "You mentioned before..."
Be natural about it - only reference when directly relevant to what they're asking.
[END CONVERSATION HISTORY]

`;
}

/**
 * Generate a chat summary with the title included
 * Format: "User is working on X, discussed Y, main themes: Z"
 */
export async function summarizeChatWithTitle(
  chatTitle: string,
  messages: ContextMessage[]
): Promise<string> {
  if (messages.length < 2) {
    return "";
  }

  try {
    // Format messages for summarization
    const conversationText = messages
      .slice(-20) // Last 20 messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 3000);

    const systemPrompt = `Summarize this conversation in ONE concise sentence (max 100 chars).
Focus on: what the user is working through or discussing.
Do NOT include the chat title in the summary - it will be added separately.
Example: "Deciding between two job offers, values work-life balance"
Example: "Frustrated with boss, considering leaving job"
Example: "Planning a difficult conversation with partner"`;

    const summary = await generateWithFireworks(systemPrompt, conversationText, 100);
    return summary.replace(/^["']|["']$/g, "").trim(); // Remove quotes if any
  } catch (error) {
    console.error("[summarizeChatWithTitle] Failed:", error);
    return "";
  }
}

/**
 * Call Fireworks API for text generation
 */
async function generateWithFireworks(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 200
): Promise<string> {
  const apiKey = process.env.FIREWORKS_API_KEY;

  if (!apiKey) {
    console.warn("FIREWORKS_API_KEY not configured");
    return "";
  }

  try {
    const response = await fetch(`${FIREWORKS_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: FAST_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Fireworks API error:", error);
      return "";
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Fireworks API call failed:", error);
    return "";
  }
}

/**
 * Compact a conversation into a summary
 * Called when conversation exceeds threshold or on chat close
 */
export async function compactConversation(
  messages: ContextMessage[]
): Promise<string> {
  if (messages.length < 4) {
    return "";
  }

  try {
    // Format messages for summarization
    const conversationText = messages
      .slice(-30) // Only summarize last 30 messages to keep it focused
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 4000); // Truncate if too long

    const systemPrompt = `Summarize the key insights from this coaching conversation in 2-3 bullet points. Focus on:
- What the user is working through
- Any decisions or realizations they had
- Emotional themes or patterns

Be concise, max 3 bullet points.`;

    const summary = await generateWithFireworks(systemPrompt, conversationText, 200);
    return summary;
  } catch (error) {
    console.error("Failed to compact conversation:", error);
    return "";
  }
}

/**
 * Extract user profile facts from a conversation
 * Called periodically to update user profile
 */
export async function extractUserProfileFacts(
  messages: ContextMessage[]
): Promise<string[]> {
  if (messages.length < 6) {
    return [];
  }

  try {
    const conversationText = messages
      .slice(-20)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 3000); // Truncate if too long

    const systemPrompt = `Extract key facts about this person from their conversation. Only include concrete facts they shared, not interpretations.

Examples of good facts:
- Works in tech as a product manager
- Has a partner named Alex
- Struggles with work-life balance
- Values honesty and directness

Return facts one per line, max 5 facts.`;

    const text = await generateWithFireworks(systemPrompt, conversationText, 150);

    // Parse facts from response
    const facts = text
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 5 && line.length < 200);

    return facts.slice(0, 5);
  } catch (error) {
    console.error("Failed to extract user profile:", error);
    return [];
  }
}

/**
 * Save compacted insights and profile facts
 * Called after significant conversations
 */
export async function saveConversationInsights(
  userId: string,
  chatId: string,
  messages: ContextMessage[],
  expiresAt?: Date
): Promise<void> {
  try {
    // Generate conversation summary
    const summary = await compactConversation(messages);

    if (summary && summary.length > 10) {
      await saveMemory({
        userId,
        chatId,
        content: summary,
        contentType: "insight",
        expiresAt,
      });
    }

    // Extract and save profile facts (less frequently - only for longer convos)
    if (messages.length >= 10) {
      const facts = await extractUserProfileFacts(messages);

      for (const fact of facts) {
        await saveMemory({
          userId,
          chatId,
          content: fact,
          contentType: "profile",
          expiresAt,
        });
      }
    }
  } catch (error) {
    console.error("Failed to save conversation insights:", error);
    // Non-blocking
  }
}

/**
 * Search memories by query (keyword-based)
 * Returns relevant memories for the current context
 */
export async function searchRelevantMemories(
  userId: string,
  query: string,
  limit = 5
): Promise<string[]> {
  try {
    const memories = await searchMemories(userId, query, limit);
    return memories.map((m) => m.content);
  } catch (error) {
    console.error("Memory search failed:", error);
    return [];
  }
}

/**
 * Check if conversation needs compaction
 */
export function shouldCompactConversation(messageCount: number): boolean {
  return messageCount > 0 && messageCount % COMPACTION_THRESHOLD === 0;
}

/**
 * Get context size info for debugging
 */
export function getContextStats(context: CompactedContext): {
  recentMessageCount: number;
  hasHistory: boolean;
  hasProfile: boolean;
  estimatedTokens: number;
} {
  // Rough token estimation (4 chars per token average)
  const historyTokens = context.historySummary
    ? Math.ceil(context.historySummary.length / 4)
    : 0;
  const profileTokens = context.userProfile
    ? Math.ceil(context.userProfile.length / 4)
    : 0;

  return {
    recentMessageCount: context.recentMessages.length,
    hasHistory: context.historySummary.length > 0,
    hasProfile: context.userProfile !== null,
    estimatedTokens: historyTokens + profileTokens,
  };
}
