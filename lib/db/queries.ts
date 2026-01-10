import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  lt,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import { generateUUID } from "../utils";
import { withDBSpan } from "../observability/logfire";
import { generateHashedPassword } from "./utils";
import {
  generateEncryptionSalt,
  deriveKeyFromToken,
  encryptMessageParts,
  safeDecryptParts,
  type EncryptedPayload,
} from "../crypto/message-encryption";
import {
  type Chat,
  chat,
  type DBMessage,
  document,
  type GlobalMemory,
  globalMemory,
  ipRateLimit,
  message,
  subscriptionEvent,
  type Suggestion,
  stream,
  suggestion,
  type User,
  user,
  type UserSettings,
  userSettings,
  vote,
} from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!, {
  max: 1, // Serverless: limit connections per instance
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout
});
const db = drizzle(client);
// ============================================
// Zero-Trust Token Authentication Functions
// ============================================

// ============================================
// IP Rate Limiting (5 accounts per IP per 24h)
// ============================================

/**
 * Atomically check and increment IP rate limit
 * Uses transaction with FOR UPDATE lock to prevent race conditions
 */
export async function checkAndIncrementIPRateLimit(ipHash: string): Promise<{
  allowed: boolean;
  newCount: number;
}> {
  const LIMIT = 5;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  try {
    return { count: updated.count, lastGeneratedAt: updated.lastGeneratedAt };
  });

  return {
    allowed: result.count <= LIMIT,
    newCount: result.count,
  };
});
  } catch (error) {
  // HARD FAILURE - Don't allow account creation if we can't track it
  console.error("Failed to check/increment IP rate limit:", error);
  throw new ChatSDKError(
    "bad_request:database",
    "Unable to verify rate limit. Please try again."
  );
}
}

// ============================================
// Zero-Trust Token Authentication Functions
// ============================================
export async function getUserByTokenHash(
  tokenHash: string
): Promise<User | null> {
  try {
    const users = await withDBSpan('user.get_by_token', { table: 'user', queryType: 'select' }, () =>
      db
        .select()
        .from(user)
        .where(eq(user.tokenHash, tokenHash))
    );
    return users[0] || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by token hash"
    );
  }
}

/**
 * Create a new user with token-based authentication
 */
export async function createTokenUser(tokenHash: string): Promise<User> {
  try {
    const [newUser] = await withDBSpan('user.create', { table: 'user', queryType: 'insert' }, () =>
      db
        .insert(user)
        .values({
          tokenHash,
          createdAt: new Date(),
          lastActiveAt: new Date(),
        })
        .returning()
    );

    return newUser;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create token user"
    );
  }
}

/**
 * Get or create user by token hash (idempotent)
 * Enforces IP rate limiting (5 accounts per IP per 24h) for new user creation
 */
export async function getOrCreateTokenUser(tokenHash: string, ipHash: string): Promise<User> {
  // Try to find existing user
  const existingUser = await getUserByTokenHash(tokenHash);

  if (existingUser) {
    // Update last active timestamp
    await db
      .update(user)
      .set({ lastActiveAt: new Date() })
      .where(eq(user.id, existingUser.id));

    return existingUser;
  }

  // Check IP rate limit before creating new user
  const { allowed, newCount } = await checkAndIncrementIPRateLimit(ipHash);
  if (!allowed) {
    throw new ChatSDKError(
      "rate_limit:account_creation",
      `Too many accounts created from this IP address. You have created ${newCount} accounts in the last 24 hours (limit: 5). Please try again later or contact support.`
    );
  }

  // Create new user
  return await createTokenUser(tokenHash);
}

/**
 * Delete user and all associated data by token hash
 * This is for the "burn" functionality
 */
export async function burnUserByTokenHash(tokenHash: string): Promise<void> {
  try {
    const userToBurn = await getUserByTokenHash(tokenHash);

    if (!userToBurn) {
      throw new ChatSDKError("not_found:user", "User not found");
    }

    // Delete all user's chats (this cascades to messages, votes, etc.)
    await deleteAllChatsByUserId({ userId: userToBurn.id });

    // Delete user
    await db.delete(user).where(eq(user.id, userToBurn.id));
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError("bad_request:database", "Failed to burn user");
  }
}

// ============================================
// Subscription & Premium Functions
// ============================================

export type PlanType = "free" | "trial" | "premium";

/**
 * Get user's current subscription plan
 */
export async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const [result] = await db
      .select({ plan: user.plan, trialEndsAt: user.trialEndsAt })
      .from(user)
      .where(eq(user.id, userId));

    if (!result) return "free";

    // Check if trial has expired
    if (result.plan === "trial" && result.trialEndsAt) {
      if (new Date() > result.trialEndsAt) {
        // Trial expired, revert to free
        await db
          .update(user)
          .set({ plan: "free" })
          .where(eq(user.id, userId));
        return "free";
      }
    }

    return (result.plan as PlanType) || "free";
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get user plan");
  }
}

/**
 * Update user's subscription plan
 */
export async function updateUserPlan(
  userId: string,
  plan: PlanType
): Promise<void> {
  try {
    await db.update(user).set({ plan }).where(eq(user.id, userId));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update user plan");
  }
}

/**
 * Check if user has premium access (premium or active trial)
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  return plan === "premium" || plan === "trial";
}

/**
 * Activate trial for user with promo code
 * Trial duration is configurable (default 7 days)
 */
export async function activateTrial(
  userId: string,
  promoCode: string,
  trialDays: number = 7
): Promise<{ success: boolean; trialEndsAt: Date }> {
  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    await db
      .update(user)
      .set({
        plan: "trial",
        promoCode,
        trialEndsAt,
      })
      .where(eq(user.id, userId));

    return { success: true, trialEndsAt };
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to activate trial");
  }
}

/**
 * Link Stripe customer ID to user
 */
export async function linkStripeCustomer(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  try {
    await db
      .update(user)
      .set({ stripeCustomerId })
      .where(eq(user.id, userId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to link Stripe customer"
    );
  }
}

/**
 * Get user by Stripe customer ID
 */
export async function getUserByStripeCustomerId(
  stripeCustomerId: string
): Promise<User | null> {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.stripeCustomerId, stripeCustomerId));
    return result || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by Stripe customer ID"
    );
  }
}

// Free users limited to 10 chats
export const FREE_USER_CHAT_LIMIT = 10;

export async function getChatCountByUserId({ userId }: { userId: string }) {
  try {
    const result = await db
      .select({ count: count() })
      .from(chat)
      .where(eq(chat.userId, userId));
    return result[0]?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to count user chats");
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      visibility,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));
    await db.delete(stream).where(eq(stream.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await db
      .select({ id: chat.id })
      .from(chat)
      .where(eq(chat.userId, userId));

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await db.delete(vote).where(inArray(vote.chatId, chatIds));
    await db.delete(message).where(inArray(message.chatId, chatIds));
    await db.delete(stream).where(inArray(stream.chatId, chatIds));

    const deletedChats = await db
      .delete(chat)
      .where(eq(chat.userId, userId))
      .returning();

    return { deletedCount: deletedChats.length };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const query = (whereCondition?: SQL<any>) =>
      db
        .select()
        .from(chat)
        .where(
          whereCondition
            ? and(whereCondition, eq(chat.userId, id))
            : eq(chat.userId, id)
        )
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Chat[] = [];

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
    } else {
      filteredChats = await query();
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function updateMessage({
  id,
  parts,
}: {
  id: string;
  parts: DBMessage["parts"];
}) {
  try {
    return await db.update(message).set({ parts }).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to update message");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

// ============================================
// Message Encryption Functions
// ============================================

/**
 * Get or create encryption salt for a user
 * Salt is generated once and stored with the user
 */
export async function getOrCreateEncryptionSalt(userId: string): Promise<string> {
  try {
    // Get current user
    const [currentUser] = await db
      .select({ encryptionSalt: user.encryptionSalt })
      .from(user)
      .where(eq(user.id, userId));

    if (!currentUser) {
      throw new ChatSDKError("not_found:user", "User not found");
    }

    // If salt exists, return it
    if (currentUser.encryptionSalt) {
      return currentUser.encryptionSalt;
    }

    // Generate new salt and store it
    const newSalt = generateEncryptionSalt();
    await db
      .update(user)
      .set({ encryptionSalt: newSalt })
      .where(eq(user.id, userId));

    return newSalt;
  } catch (error) {
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError("bad_request:database", "Failed to get encryption salt");
  }
}

/**
 * Get user's encryption salt (returns null if not set)
 */
export async function getEncryptionSalt(userId: string): Promise<string | null> {
  try {
    const [currentUser] = await db
      .select({ encryptionSalt: user.encryptionSalt })
      .from(user)
      .where(eq(user.id, userId));

    return currentUser?.encryptionSalt || null;
  } catch (_error) {
    return null;
  }
}

/**
 * Save messages with encryption
 * Encrypts message parts before storing
 *
 * @param messages - Messages to save
 * @param rawToken - User's raw token (for key derivation)
 * @param userId - User ID (for salt lookup)
 */
export async function saveMessagesEncrypted({
  messages: messagesToSave,
  rawToken,
  userId,
}: {
  messages: DBMessage[];
  rawToken: string;
  userId: string;
}) {
  try {
    // Get or create encryption salt
    const salt = await getOrCreateEncryptionSalt(userId);

    // Derive encryption key from token
    const encryptionKey = deriveKeyFromToken(rawToken, salt);

    // Encrypt each message's parts
    const encryptedMessages = messagesToSave.map((msg) => ({
      ...msg,
      parts: encryptMessageParts(msg.parts as unknown[], encryptionKey) as unknown as DBMessage["parts"],
    }));

    return await db.insert(message).values(encryptedMessages);
  } catch (error) {
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError("bad_request:database", "Failed to save encrypted messages");
  }
}

/**
 * Get messages by chat ID with decryption
 * Automatically handles both encrypted and plaintext messages
 *
 * @param id - Chat ID
 * @param rawToken - User's raw token (for key derivation)
 * @param userId - User ID (for salt lookup)
 */
export async function getMessagesDecrypted({
  id,
  rawToken,
  userId,
}: {
  id: string;
  rawToken: string;
  userId: string;
}): Promise<DBMessage[]> {
  try {
    // Get messages
    const messages = await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));

    // Get encryption salt (may be null for users without encryption)
    const salt = await getEncryptionSalt(userId);

    // If no salt, user hasn't used encryption - return as-is
    if (!salt) {
      return messages;
    }

    // Derive decryption key
    const encryptionKey = deriveKeyFromToken(rawToken, salt);

    // Decrypt each message's parts (handles both encrypted and plaintext)
    return messages.map((msg) => ({
      ...msg,
      parts: safeDecryptParts(msg.parts, encryptionKey) as DBMessage["parts"],
    }));
  } catch (error) {
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError("bad_request:database", "Failed to get decrypted messages");
  }
}

/**
 * Update message with encryption
 */
export async function updateMessageEncrypted({
  id,
  parts,
  rawToken,
  userId,
}: {
  id: string;
  parts: DBMessage["parts"];
  rawToken: string;
  userId: string;
}) {
  try {
    const salt = await getOrCreateEncryptionSalt(userId);
    const encryptionKey = deriveKeyFromToken(rawToken, salt);
    const encryptedParts = encryptMessageParts(parts as unknown[], encryptionKey);

    return await db
      .update(message)
      .set({ parts: encryptedParts as unknown as DBMessage["parts"] })
      .where(eq(message.id, id));
  } catch (error) {
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError("bad_request:database", "Failed to update encrypted message");
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === "up" })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === "up",
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp)
        )
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(eq(suggestion.documentId, documentId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
      );

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds))
        );
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatTitleById({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    return await db.update(chat).set({ title }).where(eq(chat.id, chatId));
  } catch (error) {
    console.warn("Failed to update title for chat", chatId, error);
    return;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, "user")
        )
      )
      .execute();

    return stats?.count ?? 0;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await db
      .insert(stream)
      .values({ id: streamId, chatId, createdAt: new Date() });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await db
      .select({ id: stream.id })
      .from(stream)
      .where(eq(stream.chatId, chatId))
      .orderBy(asc(stream.createdAt))
      .execute();

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}

// ============================================
// User Settings Functions (Premium)
// ============================================

/**
 * Get user settings, returns null if not found
 */
export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    const [result] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return result || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user settings"
    );
  }
}

/**
 * Get or create user settings with defaults
 */
export async function getOrCreateUserSettings(
  userId: string
): Promise<UserSettings> {
  try {
    const existing = await getUserSettings(userId);
    if (existing) return existing;

    const [created] = await db
      .insert(userSettings)
      .values({ userId })
      .returning();
    return created;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get or create user settings"
    );
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<{
    globalMemoryEnabled: boolean;
    autoVanishEnabled: boolean;
    autoVanishDays: number;
    hardBurnEnabled: boolean;
  }>
): Promise<UserSettings> {
  try {
    // Ensure settings exist first
    await getOrCreateUserSettings(userId);

    const [updated] = await db
      .update(userSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user settings"
    );
  }
}

// ============================================
// Global Memory Functions (Premium)
// ============================================

// Max memories per user to prevent unbounded growth
export const MAX_MEMORIES_PER_USER = 100;

/**
 * Count memories for a user
 */
export async function getMemoryCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: count() })
      .from(globalMemory)
      .where(eq(globalMemory.userId, userId));
    return result?.count ?? 0;
  } catch (_error) {
    return 0;
  }
}

/**
 * Save a memory entry (simple text, no embeddings)
 */
export async function saveMemory({
  userId,
  chatId,
  content,
  contentType = "insight",
  expiresAt,
}: {
  userId: string;
  chatId?: string;
  content: string;
  contentType?: string;
  expiresAt?: Date;
}): Promise<GlobalMemory> {
  try {
    const [result] = await db
      .insert(globalMemory)
      .values({
        userId,
        chatId,
        content,
        contentType,
        expiresAt,
      })
      .returning();
    return result;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save memory");
  }
}

/**
 * Search memories using simple keyword matching + recency
 * Fast hybrid search: full-text search combined with recency ordering
 */
export async function searchMemories(
  userId: string,
  query?: string,
  limit = 5
): Promise<Array<{ id: string; content: string; contentType: string; createdAt: Date }>> {
  try {
    if (query && query.trim().length > 2) {
      // Hybrid search: keyword matching + recency
      const result = await client`
        SELECT id, content, "contentType", "createdAt"
        FROM "GlobalMemory"
        WHERE "userId" = ${userId}
          AND (
            to_tsvector('english', content) @@ plainto_tsquery('english', ${query})
            OR content ILIKE ${"%" + query + "%"}
          )
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
      return result.map((row) => ({
        id: row.id as string,
        content: row.content as string,
        contentType: row.contentType as string,
        createdAt: row.createdAt as Date,
      }));
    }

    // No query - just return most recent memories
    const result = await client`
      SELECT id, content, "contentType", "createdAt"
      FROM "GlobalMemory"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
    return result.map((row) => ({
      id: row.id as string,
      content: row.content as string,
      contentType: row.contentType as string,
      createdAt: row.createdAt as Date,
    }));
  } catch (error) {
    console.error("Memory search error:", error);
    return [];
  }
}

/**
 * Search memories by vector similarity using pgvector
 * Uses cosine distance for similarity calculation
 */
export async function searchMemoriesByVector(
  userId: string,
  embedding: number[],
  limit = 5,
  threshold = 0.7
): Promise<Array<{ id: string; content: string; similarity: number; contentType: string; createdAt: Date }>> {
  try {
    // Use raw SQL for vector similarity search with pgvector
    const result = await client`
      SELECT
        id,
        content,
        "contentType",
        "createdAt",
        1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM "GlobalMemory"
      WHERE "userId" = ${userId}
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > ${threshold}
      ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      id: row.id as string,
      content: row.content as string,
      contentType: row.contentType as string,
      createdAt: row.createdAt as Date,
      similarity: Number(row.similarity),
    }));
  } catch (error) {
    console.error("Vector search error:", error);
    // Return empty array on error (non-blocking)
    return [];
  }
}

/**
 * Get recent memories for a user (without vector search)
 */
export async function getRecentMemories(
  userId: string,
  limit = 10
): Promise<GlobalMemory[]> {
  try {
    return await db
      .select()
      .from(globalMemory)
      .where(eq(globalMemory.userId, userId))
      .orderBy(desc(globalMemory.createdAt))
      .limit(limit);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get recent memories"
    );
  }
}

/**
 * Delete all memories for a user
 */
export async function deleteUserMemories(userId: string): Promise<void> {
  try {
    await db.delete(globalMemory).where(eq(globalMemory.userId, userId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete user memories"
    );
  }
}

/**
 * Chat summary for cross-chat context
 */
export interface ChatSummary {
  chatId: string;
  title: string;
  summary: string | null;
  createdAt: Date;
}

/**
 * Get all chat summaries for a user (for cross-chat context)
 * Returns chat titles + their summaries from GlobalMemory
 */
export async function getAllChatSummaries(
  userId: string,
  limit = 20
): Promise<ChatSummary[]> {
  try {
    // Get all chats for the user with their titles
    const chats = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
      })
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(limit);

    if (chats.length === 0) return [];

    // Get summaries for these chats from GlobalMemory
    const chatIds = chats.map((c) => c.id);
    const summaries = await db
      .select({
        chatId: globalMemory.chatId,
        content: globalMemory.content,
      })
      .from(globalMemory)
      .where(
        and(
          eq(globalMemory.userId, userId),
          eq(globalMemory.contentType, "chat_summary"),
          inArray(globalMemory.chatId, chatIds)
        )
      );

    // Create a map for quick lookup
    const summaryMap = new Map(
      summaries.map((s) => [s.chatId, s.content])
    );

    // Combine chats with their summaries
    return chats.map((c) => ({
      chatId: c.id,
      title: c.title,
      summary: summaryMap.get(c.id) || null,
      createdAt: c.createdAt,
    }));
  } catch (error) {
    console.error("[getAllChatSummaries] Error:", error);
    return [];
  }
}

/**
 * Save or update chat summary
 */
export async function saveChatSummary({
  userId,
  chatId,
  summary,
  expiresAt,
}: {
  userId: string;
  chatId: string;
  summary: string;
  expiresAt?: Date;
}): Promise<void> {
  try {
    // Delete existing summary for this chat (if any)
    await db
      .delete(globalMemory)
      .where(
        and(
          eq(globalMemory.userId, userId),
          eq(globalMemory.chatId, chatId),
          eq(globalMemory.contentType, "chat_summary")
        )
      );

    // Insert new summary
    await db.insert(globalMemory).values({
      userId,
      chatId,
      content: summary,
      contentType: "chat_summary",
      expiresAt,
    });
  } catch (error) {
    console.error("[saveChatSummary] Error:", error);
    // Non-blocking
  }
}

/**
 * Delete expired memories (for auto-vanish cleanup)
 * Only deletes records where expiresAt is set AND has passed
 */
export async function deleteExpiredMemories(): Promise<number> {
  try {
    const now = new Date();
    console.log(`[deleteExpiredMemories] Checking for expired memories before ${now.toISOString()}`);

    const result = await db
      .delete(globalMemory)
      .where(
        and(
          isNotNull(globalMemory.expiresAt),
          lt(globalMemory.expiresAt, now)
        )
      )
      .returning({ id: globalMemory.id });

    console.log(`[deleteExpiredMemories] Successfully deleted ${result.length} expired memories`);
    return result.length;
  } catch (error) {
    console.error('[deleteExpiredMemories] Database error:', error);

    // Check if table exists error
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.error('[deleteExpiredMemories] GlobalMemory table does not exist. Migration 0009 may not have run.');
      throw new ChatSDKError(
        "bad_request:database",
        "GlobalMemory table not found - database migration required"
      );
    }

    throw new ChatSDKError(
      "bad_request:database",
      `Failed to delete expired memories: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete memories for a specific chat
 */
export async function deleteMemoriesByChatId(chatId: string): Promise<void> {
  try {
    await db.delete(globalMemory).where(eq(globalMemory.chatId, chatId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete memories by chat id"
    );
  }
}

// ============================================
// Subscription Event Functions
// ============================================

/**
 * Log a subscription event
 */
export async function logSubscriptionEvent({
  userId,
  eventType,
  previousPlan,
  newPlan,
  stripeEventId,
  metadata,
}: {
  userId: string;
  eventType: string;
  previousPlan?: string;
  newPlan?: string;
  stripeEventId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(subscriptionEvent).values({
      userId,
      eventType,
      previousPlan,
      newPlan,
      stripeEventId,
      metadata,
    });
  } catch (_error) {
    // Non-blocking - just log the error
    console.error("Failed to log subscription event:", _error);
  }
}

/**
 * Check if a Stripe event has already been processed (idempotency)
 */
export async function isStripeEventProcessed(
  stripeEventId: string
): Promise<boolean> {
  try {
    const [result] = await db
      .select({ id: subscriptionEvent.id })
      .from(subscriptionEvent)
      .where(eq(subscriptionEvent.stripeEventId, stripeEventId))
      .limit(1);
    return !!result;
  } catch (_error) {
    return false;
  }
}

// ============================================
// Auto-Vanish Cleanup Functions
// ============================================

/**
 * Delete expired chats for users with auto-vanish enabled
 */
export async function deleteExpiredChatsForAutoVanish(): Promise<number> {
  try {
    console.log('[deleteExpiredChatsForAutoVanish] Starting auto-vanish chat cleanup');

    // Get users with auto-vanish enabled
    const usersWithAutoVanish = await db
      .select({
        userId: userSettings.userId,
        autoVanishDays: userSettings.autoVanishDays,
      })
      .from(userSettings)
      .where(eq(userSettings.autoVanishEnabled, true));

    console.log(`[deleteExpiredChatsForAutoVanish] Found ${usersWithAutoVanish.length} users with auto-vanish enabled`);

    let totalDeleted = 0;

    for (const userConfig of usersWithAutoVanish) {
      // Validate autoVanishDays to prevent negative values
      const days = Math.max(1, userConfig.autoVanishDays || 30);

      // Calculate cutoff date more safely
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      console.log(`[deleteExpiredChatsForAutoVanish] User ${userConfig.userId}: deleting chats older than ${cutoffDate.toISOString()} (${days} days)`);

      // Get chats to delete
      const chatsToDelete = await db
        .select({ id: chat.id })
        .from(chat)
        .where(
          and(
            eq(chat.userId, userConfig.userId),
            lt(chat.createdAt, cutoffDate)
          )
        );

      console.log(`[deleteExpiredChatsForAutoVanish] Found ${chatsToDelete.length} chats to delete for user ${userConfig.userId}`);

      for (const chatToDelete of chatsToDelete) {
        try {
          await deleteChatById({ id: chatToDelete.id });
          totalDeleted++;
        } catch (deleteError) {
          console.error(`[deleteExpiredChatsForAutoVanish] Failed to delete chat ${chatToDelete.id}:`, deleteError);
          // Continue with other chats even if one fails
        }
      }
    }

    console.log(`[deleteExpiredChatsForAutoVanish] Successfully deleted ${totalDeleted} expired chats`);
    return totalDeleted;
  } catch (error) {
    console.error('[deleteExpiredChatsForAutoVanish] Error during cleanup:', error);
    throw new ChatSDKError(
      "bad_request:database",
      `Failed to delete expired chats: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================
// On-Login Auto-Vanish (Per-User Cleanup)
// ============================================

/**
 * Run cleanup for a specific user if not run recently
 * Called on authentication - avoids running cleanup every request
 * Non-blocking - errors don't affect login flow
 */
export async function runUserCleanupIfNeeded(userId: string): Promise<void> {
  try {
    // Get user settings
    const settings = await getUserSettings(userId);

    // If no settings or auto-vanish disabled, skip
    if (!settings?.autoVanishEnabled) {
      return;
    }

    // Check if cleanup ran in last 24 hours
    const lastCleanup = settings.lastCleanupAt;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (lastCleanup && lastCleanup > oneDayAgo) {
      return; // Already ran recently
    }

    // Run per-user cleanup
    await deleteExpiredMemoriesForUser(userId);
    await deleteExpiredChatsForUser(userId, settings.autoVanishDays);

    // Update last cleanup timestamp
    await db
      .update(userSettings)
      .set({ lastCleanupAt: new Date(), updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));

  } catch (error) {
    // Non-blocking - log but don't fail login
    console.error(`[runUserCleanupIfNeeded] Cleanup failed for user ${userId}:`, error);
  }
}

/**
 * Delete expired memories for a specific user
 */
export async function deleteExpiredMemoriesForUser(userId: string): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(globalMemory)
      .where(
        and(
          eq(globalMemory.userId, userId),
          isNotNull(globalMemory.expiresAt),
          lt(globalMemory.expiresAt, now)
        )
      )
      .returning({ id: globalMemory.id });

    if (result.length > 0) {
      console.log(`[deleteExpiredMemoriesForUser] Deleted ${result.length} expired memories for user ${userId}`);
    }
    return result.length;
  } catch (error) {
    console.error(`[deleteExpiredMemoriesForUser] Error for user ${userId}:`, error);
    return 0;
  }
}

/**
 * Delete expired chats for a specific user based on their auto-vanish settings
 */
export async function deleteExpiredChatsForUser(
  userId: string,
  autoVanishDays: number
): Promise<number> {
  try {
    const days = Math.max(1, autoVanishDays || 30);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get chats to delete
    const chatsToDelete = await db
      .select({ id: chat.id })
      .from(chat)
      .where(
        and(
          eq(chat.userId, userId),
          lt(chat.createdAt, cutoffDate)
        )
      );

    let deletedCount = 0;
    for (const chatToDelete of chatsToDelete) {
      try {
        await deleteChatById({ id: chatToDelete.id });
        deletedCount++;
      } catch (deleteError) {
        console.error(`[deleteExpiredChatsForUser] Failed to delete chat ${chatToDelete.id}:`, deleteError);
      }
    }

    if (deletedCount > 0) {
      console.log(`[deleteExpiredChatsForUser] Deleted ${deletedCount} expired chats for user ${userId}`);
    }
    return deletedCount;
  } catch (error) {
    console.error(`[deleteExpiredChatsForUser] Error for user ${userId}:`, error);
    return 0;
  }
}
