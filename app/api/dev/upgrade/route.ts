import { authenticateToken } from "@/lib/auth/token-auth";
import { updateUserPlan } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

/**
 * DEV ONLY: Bypass Stripe and upgrade user to premium
 * DELETE THIS IN PRODUCTION or protect with admin auth
 *
 * Usage: POST /api/dev/upgrade
 * Header: x-privy-token: your-token
 */
export async function POST(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_UPGRADE) {
    return new Response("Not available in production", { status: 403 });
  }

  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    // Upgrade to premium
    await updateUserPlan(user.id, "premium");

    return Response.json({
      success: true,
      message: "Upgraded to premium (dev bypass)",
      userId: user.id,
    });
  } catch (error) {
    console.error("Dev upgrade error:", error);
    return new Response("Failed to upgrade", { status: 500 });
  }
}

/**
 * DEV ONLY: Downgrade user back to free
 */
export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_UPGRADE) {
    return new Response("Not available in production", { status: 403 });
  }

  try {
    const user = await authenticateToken(request);

    if (!user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    await updateUserPlan(user.id, "free");

    return Response.json({
      success: true,
      message: "Downgraded to free",
      userId: user.id,
    });
  } catch (error) {
    console.error("Dev downgrade error:", error);
    return new Response("Failed to downgrade", { status: 500 });
  }
}
