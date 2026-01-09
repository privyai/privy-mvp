-- Add encryption salt column to User table
-- This salt is used with PBKDF2 to derive encryption keys from user tokens
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "encryptionSalt" VARCHAR(32);

-- Add lastCleanupAt column to UserSettings table
-- Used for on-login auto-vanish (to avoid running cleanup every request)
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "lastCleanupAt" TIMESTAMP;

-- Add index on encryptionSalt for faster lookups (nullable, only set after first encrypted message)
CREATE INDEX IF NOT EXISTS "User_encryptionSalt_idx" ON "User" ("encryptionSalt") WHERE "encryptionSalt" IS NOT NULL;
