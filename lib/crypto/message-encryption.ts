import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
  timingSafeEqual,
} from "crypto";

/**
 * Message Encryption for Privy
 *
 * Uses AES-256-GCM with PBKDF2-derived keys from user tokens.
 * This provides encryption at rest where only the token holder can decrypt.
 *
 * Security properties:
 * - Key derived from user token (only they know it)
 * - Unique salt per user (stored in DB)
 * - Unique IV per message (stored with ciphertext)
 * - Authenticated encryption (GCM mode prevents tampering)
 * - If token is lost, data is unrecoverable (feature, not bug)
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (recommended for GCM)
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const SALT_LENGTH = 16; // 128 bits

/**
 * Encrypted payload structure
 * Stored as JSON in database
 */
export interface EncryptedPayload {
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded ciphertext */
  data: string;
  /** Base64-encoded authentication tag */
  tag: string;
  /** Version for future migrations */
  v: number;
}

/**
 * Generate a random salt for a new user
 * Called once when user is created, stored in User.encryptionSalt
 */
export function generateEncryptionSalt(): string {
  return randomBytes(SALT_LENGTH).toString("hex");
}

/**
 * Derive a 256-bit encryption key from user's token and salt
 * Uses PBKDF2 with SHA-256
 *
 * @param token - User's raw token (64 hex chars)
 * @param salt - User's unique salt (stored in DB)
 * @returns Buffer containing 256-bit key
 */
export function deriveKeyFromToken(token: string, salt: string): Buffer {
  // Add master salt from environment for defense in depth
  const masterSalt = process.env.ENCRYPTION_MASTER_SALT || "";
  const combinedSalt = `${salt}:${masterSalt}`;

  return pbkdf2Sync(
    token,
    combinedSalt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
}

/**
 * Encrypt a message string using AES-256-GCM
 *
 * @param plaintext - The message content to encrypt
 * @param key - 256-bit encryption key from deriveKeyFromToken
 * @returns Encrypted payload with iv, data, tag, and version
 */
export function encryptMessage(
  plaintext: string,
  key: Buffer
): EncryptedPayload {
  // Generate random IV for this message
  const iv = randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    data: encrypted.toString("base64"),
    tag: tag.toString("base64"),
    v: 1,
  };
}

/**
 * Decrypt a message using AES-256-GCM
 *
 * @param payload - Encrypted payload from encryptMessage
 * @param key - 256-bit encryption key from deriveKeyFromToken
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data)
 */
export function decryptMessage(payload: EncryptedPayload, key: Buffer): string {
  // Parse payload
  const iv = Buffer.from(payload.iv, "base64");
  const data = Buffer.from(payload.data, "base64");
  const tag = Buffer.from(payload.tag, "base64");

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Set auth tag for verification
  decipher.setAuthTag(tag);

  // Decrypt
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Check if a value is an encrypted payload
 * Used to distinguish encrypted from plaintext messages (migration support)
 */
export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.iv === "string" &&
    typeof obj.data === "string" &&
    typeof obj.tag === "string" &&
    typeof obj.v === "number"
  );
}

/**
 * Encrypt message parts (JSON content)
 * Handles the parts array structure used in Message_v2
 */
export function encryptMessageParts(
  parts: unknown[],
  key: Buffer
): EncryptedPayload {
  const plaintext = JSON.stringify(parts);
  return encryptMessage(plaintext, key);
}

/**
 * Decrypt message parts
 * Returns original parts array
 */
export function decryptMessageParts(
  payload: EncryptedPayload,
  key: Buffer
): unknown[] {
  const plaintext = decryptMessage(payload, key);
  return JSON.parse(plaintext);
}

/**
 * Safe decrypt with fallback for unencrypted messages
 * Used during migration period when some messages may be plaintext
 *
 * @param parts - Either encrypted payload or plain parts array
 * @param key - Encryption key (only used if encrypted)
 * @returns Decrypted or original parts array
 */
export function safeDecryptParts(
  parts: unknown,
  key: Buffer | null
): unknown[] {
  // If it's an encrypted payload and we have a key, decrypt
  if (isEncryptedPayload(parts)) {
    if (!key) {
      console.error("[DECRYPTION ERROR] Encrypted message found but no key provided", {
        hasIv: !!parts.iv,
        hasData: !!parts.data,
        hasTag: !!parts.tag,
        version: parts.v,
      });
      return [{ type: "text", text: "[Message encrypted - key unavailable]" }];
    }

    try {
      const decrypted = decryptMessageParts(parts, key);
      return decrypted;
    } catch (error) {
      console.error("[DECRYPTION ERROR] Failed to decrypt message parts", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payloadVersion: parts.v,
        ivLength: parts.iv?.length,
        dataLength: parts.data?.length,
      });
      return [{ type: "text", text: "[Message decryption failed]" }];
    }
  }

  // If it's already an array (plaintext), return as-is
  if (Array.isArray(parts)) {
    return parts;
  }

  // Unknown format - log details
  console.error("[DECRYPTION ERROR] Unknown message parts format", {
    type: typeof parts,
    isObject: parts !== null && typeof parts === "object",
    keys: parts !== null && typeof parts === "object" ? Object.keys(parts as object) : [],
  });
  return [{ type: "text", text: "[Message format unrecognized]" }];
}

/**
 * Encrypt memory content (for GlobalMemory table)
 */
export function encryptMemoryContent(
  content: string,
  key: Buffer
): EncryptedPayload {
  return encryptMessage(content, key);
}

/**
 * Decrypt memory content with fallback
 */
export function safeDecryptMemory(
  content: unknown,
  key: Buffer | null
): string {
  // If encrypted and we have key
  if (isEncryptedPayload(content) && key) {
    try {
      return decryptMessage(content, key);
    } catch {
      return "";
    }
  }

  // If string (plaintext), return as-is
  if (typeof content === "string") {
    return content;
  }

  return "";
}
