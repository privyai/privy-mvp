import { authenticateToken } from "@/lib/auth/token-auth";
import {
  isPremiumUser,
  getUserSettings,
  searchMemories,
  saveMemory,
  deleteUserMemories,
  getMemoryCount,
  MAX_MEMORIES_PER_USER,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * GET /api/memory - Retrieve relevant memories for context
 * Query params:
 *   - query: Search query text (optional, if not provided returns recent memories)
 *   - limit: Max results (default 5)
 */
export async function GET(request: Request) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check if user has premium access
    const isPremium = await isPremiumUser(user.id);
    if (!isPremium) {
      return Response.json({
        memories: [],
        message: "Global Memory requires Premium subscription",
      });
    }

    // Check if user has global memory enabled
    const settings = await getUserSettings(user.id);
    if (settings && !settings.globalMemoryEnabled) {
      return Response.json({
        memories: [],
        message: "Global Memory is disabled in your settings",
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

    // Simple hybrid search: keyword matching + recency (no vector embeddings)
    // If no query, returns most recent memories
    const memories = await searchMemories(user.id, query || undefined, limit);

    return Response.json({
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        contentType: m.contentType,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Memory retrieval error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError(
      "bad_request:api",
      "Failed to retrieve memories"
    ).toResponse();
  }
}

/**
 * POST /api/memory - Store a new memory
 * Body: { content: string, contentType?: string, chatId?: string }
 */
export async function POST(request: Request) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Check if user has premium access
    const isPremium = await isPremiumUser(user.id);
    if (!isPremium) {
      return new ChatSDKError(
        "forbidden:api",
        "Global Memory requires Premium subscription"
      ).toResponse();
    }

    // Check if user has global memory enabled
    const settings = await getUserSettings(user.id);
    if (settings && !settings.globalMemoryEnabled) {
      return new ChatSDKError(
        "forbidden:api",
        "Global Memory is disabled in your settings"
      ).toResponse();
    }

    const body = await request.json();
    const { content, contentType = "insight", chatId } = body;

    if (!content || typeof content !== "string" || content.length < 10) {
      return new ChatSDKError(
        "bad_request:api",
        "Content must be at least 10 characters"
      ).toResponse();
    }

    // Check memory limit with a transaction
    const memoryCount = await getMemoryCount(user.id);
    if (memoryCount >= MAX_MEMORIES_PER_USER) {
      return new ChatSDKError(
        "forbidden:api",
        `Memory limit reached (${MAX_MEMORIES_PER_USER}). Delete old memories to add new ones.`
      ).toResponse();
    }

    // Calculate expiry if auto-vanish is enabled
    let expiresAt: Date | undefined;
    if (settings?.autoVanishEnabled && settings.autoVanishDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + settings.autoVanishDays);
    }

    // Save the memory (simple text storage, no embeddings)
    const memory = await saveMemory({
      userId: user.id,
      chatId,
      content,
      contentType,
      expiresAt,
    });

    return Response.json({
      success: true,
      memory: {
        id: memory.id,
        content: memory.content,
        contentType: memory.contentType,
        createdAt: memory.createdAt,
      },
    });
  } catch (error) {
    console.error("Memory save error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError(
      "bad_request:api",
      "Failed to save memory"
    ).toResponse();
  }
}

/**
 * DELETE /api/memory - Delete all user memories
 */
export async function DELETE(request: Request) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    await deleteUserMemories(user.id);

    return Response.json({
      success: true,
      message: "All memories deleted",
    });
  } catch (error) {
    console.error("Memory delete error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return new ChatSDKError(
      "bad_request:api",
      "Failed to delete memories"
    ).toResponse();
  }
}
