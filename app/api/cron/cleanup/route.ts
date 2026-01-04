import {
  deleteExpiredMemories,
  deleteExpiredChatsForAutoVanish,
} from "@/lib/db/queries";

/**
 * Auto-vanish cleanup cron job
 * Runs daily to delete expired memories and chats
 * Configured in vercel.json - Vercel handles scheduling
 */
export async function GET(request: Request) {
  // Vercel cron jobs are protected - only Vercel can trigger them in production
  // No manual CRON_SECRET needed

  try {
    console.log("Starting auto-vanish cleanup...");

    // Delete expired memories (based on expiresAt timestamp)
    const memoriesDeleted = await deleteExpiredMemories();
    console.log(`Deleted ${memoriesDeleted} expired memories`);

    // Delete expired chats for users with auto-vanish enabled
    const chatsDeleted = await deleteExpiredChatsForAutoVanish();
    console.log(`Deleted ${chatsDeleted} expired chats`);

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      memoriesDeleted,
      chatsDeleted,
    });
  } catch (error) {
    console.error("Cleanup job failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Cleanup failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
