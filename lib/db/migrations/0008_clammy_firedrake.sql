CREATE TABLE IF NOT EXISTS "IPRateLimit" (
	"ipHash" varchar(64) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"lastGeneratedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "tokenHash" varchar(64);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "plan" varchar(32) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "lastActiveAt" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ip_rate_limit_timestamp" ON "IPRateLimit" USING btree ("lastGeneratedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_chat_created" ON "Message_v2" USING btree ("chatId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_message_role_created" ON "Message_v2" USING btree ("role","createdAt");--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "lastContext";--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_tokenHash_unique" UNIQUE("tokenHash");