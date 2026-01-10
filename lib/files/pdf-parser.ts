import "server-only";
import pdf from "pdf-parse";

/**
 * Simple PDF text extraction for coaching context
 * Uses pdf-parse for basic text extraction - no complex layout preservation
 */

export interface ParsedPdf {
  text: string;
  pageCount: number;
  truncated: boolean;
}

const MAX_TEXT_LENGTH = 50000; // ~12k tokens, reasonable for context
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Extract text from a PDF buffer
 * Returns plain text suitable for AI context
 */
export async function extractPdfText(buffer: Buffer): Promise<ParsedPdf> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`PDF too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Validate PDF magic bytes (%PDF-)
  const header = buffer.slice(0, 5).toString('ascii');
  if (!header.startsWith('%PDF-')) {
    throw new Error('Invalid PDF file. File does not have valid PDF header.');
  }

  try {
    const data = await pdf(buffer);

    let text = data.text || "";
    let truncated = false;

    // Clean up the text
    text = text
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
      .replace(/[ \t]+/g, " ") // Collapse multiple spaces
      .trim();

    // Truncate if too long
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
      // Try to end at a sentence
      const lastPeriod = text.lastIndexOf(".");
      if (lastPeriod > MAX_TEXT_LENGTH * 0.8) {
        text = text.substring(0, lastPeriod + 1);
      }
      text += "\n\n[Document truncated due to length]";
      truncated = true;
    }

    return {
      text,
      pageCount: data.numpages || 0,
      truncated,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF. The file may be corrupted or password-protected.");
  }
}

/**
 * Validate that a file is a PDF
 */
export function isPdfFile(filename: string, mimeType: string): boolean {
  const hasCorrectExtension = filename.toLowerCase().endsWith(".pdf");
  const hasCorrectMimeType = mimeType === "application/pdf";
  // Require BOTH extension AND mime type to prevent bypass attacks
  return hasCorrectExtension && hasCorrectMimeType;
}

/**
 * Format extracted PDF text for use as coaching context
 */
export function formatPdfForContext(
  filename: string,
  parsed: ParsedPdf
): string {
  if (!parsed.text || parsed.text.length < 10) {
    return "";
  }

  // Sanitize filename to prevent XSS (remove special chars, limit length)
  const sanitizedFilename = filename
    .replace(/[<>"'&\\]/g, '')
    .slice(0, 100);

  return `[Document: ${sanitizedFilename}]
${parsed.text}
[End of document]`;
}
