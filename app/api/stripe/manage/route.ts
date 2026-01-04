import { authenticateToken } from "@/lib/auth/token-auth";
import { ChatSDKError } from "@/lib/errors";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const authenticatedUser = await authenticateToken(request);

        if (!authenticatedUser) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Get user's Stripe customer ID
        const [userData] = await db
            .select({ stripeCustomerId: user.stripeCustomerId })
            .from(user)
            .where(eq(user.id, authenticatedUser.id));

        if (!userData?.stripeCustomerId) {
            return new ChatSDKError(
                "bad_request:api",
                "No active subscription found. Please subscribe first."
            ).toResponse();
        }

        // Get return URL from request
        const origin =
            request.headers.get("origin") || "http://localhost:3000";

        // Create Stripe Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: userData.stripeCustomerId,
            return_url: `${origin}/chat`,
        });

        return Response.json({ url: session.url });
    } catch (error) {
        console.error("Manage subscription error:", error);

        if (error instanceof ChatSDKError) {
            return error.toResponse();
        }

        return new ChatSDKError(
            "bad_request:api",
            "Failed to create portal session"
        ).toResponse();
    }
}
