-- Migration: Add token authentication columns to User table
-- These columns support the zero-trust token-based authentication system

-- Add tokenHash column for token-based auth (unique to identify users)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenHash" varchar(64) UNIQUE;

-- Add createdAt column if missing
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT NOW();

-- Add lastActiveAt column for tracking user activity
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" timestamp;

-- Add plan column if missing (default to free)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" varchar(16) DEFAULT 'free';

-- Make email nullable (for token-based users who don't have email)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Create index on tokenHash for faster lookups
CREATE INDEX IF NOT EXISTS "User_tokenHash_idx" ON "User" ("tokenHash");
