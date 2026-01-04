import "server-only";

/**
 * Embeddings and summarization for Global Memory feature
 * Uses Fireworks Qwen3 embedding model - no OpenAI needed
 */

const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1";
const EMBEDDING_MODEL = "accounts/fireworks/models/qwen3-embedding-8b";
const CHAT_MODEL = "accounts/fireworks/models/minimax-m2p1";

/**
 * Generate embeddings using Fireworks Qwen3 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.FIREWORKS_API_KEY;

  if (!apiKey) {
    console.warn("FIREWORKS_API_KEY not configured, skipping embedding");
    return [];
  }

  try {
    const response = await fetch(`${FIREWORKS_API_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000), // Truncate if too long
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Embedding API error:", error);
      return [];
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Embedding generation error:", error);
    return [];
  }
}

/**
 * Check if embedding service is configured
 */
export function isEmbeddingServiceConfigured(): boolean {
  return !!process.env.FIREWORKS_API_KEY;
}

/**
 * Generate a summary of a conversation for memory storage
 * Uses Fireworks MiniMax model
 */
export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const apiKey = process.env.FIREWORKS_API_KEY;

  if (!apiKey) {
    console.warn("FIREWORKS_API_KEY not configured, skipping summary");
    return "";
  }

  const conversationText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
    .slice(0, 4000);

  try {
    const response = await fetch(`${FIREWORKS_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          {
            role: "system",
            content: `Extract the key insight from this coaching conversation.
Rules:
- Be concise (1-2 sentences max)
- Focus on actionable insights or emotional breakthroughs
- Write in third person (e.g., "User realized..." or "User is working on...")
- If no meaningful insight, respond with "NO_INSIGHT"`,
          },
          {
            role: "user",
            content: conversationText,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Summary API error:", error);
      return "";
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();

    if (summary === "NO_INSIGHT" || summary.length < 10) {
      return "";
    }

    return summary;
  } catch (error) {
    console.error("Summary generation error:", error);
    return "";
  }
}

/**
 * Generate embedding for a conversation summary
 * Returns both the summary and its embedding
 */
export async function generateConversationEmbedding(
  messages: Array<{ role: string; content: string }>
): Promise<{ summary: string; embedding: number[] } | null> {
  try {
    const summary = await generateConversationSummary(messages);

    if (!summary) {
      return null;
    }

    const embedding = await generateEmbedding(summary);
    if (embedding.length === 0) {
      return null;
    }

    return { summary, embedding };
  } catch (error) {
    console.error("Failed to generate conversation embedding:", error);
    return null;
  }
}
