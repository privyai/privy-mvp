-- Migration: Add Stripe subscription columns to User table
-- plan column already exists in production DB, adding Stripe-related columns

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(64);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "trialEndsAt" timestamp;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "promoCode" varchar(32);

-- Create index on stripeCustomerId for faster lookups
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User" ("stripeCustomerId");
