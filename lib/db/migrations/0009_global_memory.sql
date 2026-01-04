-- Global Memory table for cross-session context (Premium feature)
-- Simple text storage - no vector embeddings needed
CREATE TABLE IF NOT EXISTS "GlobalMemory" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "chatId" uuid REFERENCES "Chat"("id") ON DELETE SET NULL,
  "content" text NOT NULL,
  "contentType" varchar(16) NOT NULL DEFAULT 'insight',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "expiresAt" timestamp
);

-- Create indexes for GlobalMemory (simple, fast lookups)
CREATE INDEX IF NOT EXISTS "GlobalMemory_userId_idx" ON "GlobalMemory"("userId");
CREATE INDEX IF NOT EXISTS "GlobalMemory_createdAt_idx" ON "GlobalMemory"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "GlobalMemory_expiresAt_idx" ON "GlobalMemory"("expiresAt") WHERE "expiresAt" IS NOT NULL;
-- GIN index for fast text search
CREATE INDEX IF NOT EXISTS "GlobalMemory_content_idx" ON "GlobalMemory" USING gin(to_tsvector('english', "content"));

-- User Settings table for premium feature configuration
CREATE TABLE IF NOT EXISTS "UserSettings" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "globalMemoryEnabled" boolean NOT NULL DEFAULT true,
  "autoVanishEnabled" boolean NOT NULL DEFAULT false,
  "autoVanishDays" integer NOT NULL DEFAULT 30,
  "hardBurnEnabled" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create index for UserSettings
CREATE INDEX IF NOT EXISTS "UserSettings_userId_idx" ON "UserSettings"("userId");

-- Subscription Events table for tracking subscription changes
CREATE TABLE IF NOT EXISTS "SubscriptionEvent" (
  "id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "eventType" varchar(32) NOT NULL,
  "previousPlan" varchar(16),
  "newPlan" varchar(16),
  "stripeEventId" varchar(64),
  "metadata" jsonb,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for SubscriptionEvent
CREATE INDEX IF NOT EXISTS "SubscriptionEvent_userId_idx" ON "SubscriptionEvent"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionEvent_stripeEventId_idx" ON "SubscriptionEvent"("stripeEventId") WHERE "stripeEventId" IS NOT NULL;

-- Create function to automatically update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for UserSettings updatedAt
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON "UserSettings";
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON "UserSettings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
