import { NextResponse } from "next/server";
import { authenticateToken } from "@/lib/auth/token-auth";
import { isPremiumUser, saveMemory, getUserSettings } from "@/lib/db/queries";
import {
  extractPdfText,
  isPdfFile,
  formatPdfForContext,
} from "@/lib/files/pdf-parser";

/**
 * Simple in-memory rate limiting for PDF uploads
 * Limits: 10 uploads per user per hour
 */
const uploadRateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = uploadRateLimits.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    uploadRateLimits.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

/**
 * PDF Upload endpoint for premium users
 * Extracts text and saves as coaching context (memory)
 *
 * POST /api/files/pdf
 * - Requires authentication
 * - Premium users only
 * - Max 10MB PDF
 * - Rate limited: 10 uploads/hour
 * - Returns extracted text preview
 */
export async function POST(request: Request) {
  // Authenticate
  const user = await authenticateToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check premium status
  const hasPremium = await isPremiumUser(user.id);
  if (!hasPremium) {
    return NextResponse.json(
      { error: "PDF upload is a premium feature. Please upgrade to continue." },
      { status: 403 }
    );
  }

  // Check rate limit
  const { allowed, remaining } = checkRateLimit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 10 PDF uploads per hour." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!isPdfFile(file.name, file.type)) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await extractPdfText(buffer);

    if (!parsed.text || parsed.text.length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. The file may be image-only or empty." },
        { status: 400 }
      );
    }

    // Format for context
    const formattedContent = formatPdfForContext(file.name, parsed);

    // Get user settings for expiry
    const settings = await getUserSettings(user.id);
    let expiresAt: Date | undefined;
    if (settings?.autoVanishEnabled && settings.autoVanishDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + settings.autoVanishDays);
    }

    // Save as memory for coaching context
    await saveMemory({
      userId: user.id,
      content: formattedContent,
      contentType: "document",
      expiresAt,
    });

    // Return success with preview
    const preview = parsed.text.substring(0, 500) + (parsed.text.length > 500 ? "..." : "");

    return NextResponse.json({
      success: true,
      filename: file.name,
      pageCount: parsed.pageCount,
      characterCount: parsed.text.length,
      truncated: parsed.truncated,
      preview,
      message: "Document uploaded and will be used as coaching context.",
    });
  } catch (error) {
    console.error("PDF upload error:", error);

    const message = error instanceof Error ? error.message : "Failed to process PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
