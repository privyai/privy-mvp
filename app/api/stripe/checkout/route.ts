import { authenticateToken } from "@/lib/auth/token-auth";
import { ChatSDKError } from "@/lib/errors";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        // Authenticate user via token
        const user = await authenticateToken(request);

        if (!user) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Get return URL from request body or use origin
        const { returnUrl } = await request.json().catch(() => ({}));
        const origin = request.headers.get("origin") || "http://localhost:3000";
        const baseUrl = returnUrl || origin;

        // Create Stripe checkout session
        const { url } = await createCheckoutSession({
            userId: user.id,
            returnUrl: baseUrl,
        });

        return Response.json({ url });
    } catch (error) {
        console.error("Checkout error:", error);

        if (error instanceof ChatSDKError) {
            return error.toResponse();
        }

        return new ChatSDKError(
            "bad_request:api",
            "Failed to create checkout session"
        ).toResponse();
    }
}
