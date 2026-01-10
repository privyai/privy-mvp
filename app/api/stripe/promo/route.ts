import { authenticateToken } from "@/lib/auth/token-auth";
import { activateTrial, getUserPlan } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { validatePromoCode, getPromoCodeTrialDays } from "@/lib/stripe";

export async function POST(request: Request) {
    try {
        // Authenticate user via token
        const user = await authenticateToken(request);

        if (!user) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Get promo code from request body
        const { promoCode } = await request.json();

        if (!promoCode || typeof promoCode !== "string") {
            return new ChatSDKError(
                "bad_request:api",
                "Promo code is required"
            ).toResponse();
        }

        // Check if user already has premium or trial
        const currentPlan = await getUserPlan(user.id);
        if (currentPlan !== "free") {
            return new ChatSDKError(
                "bad_request:api",
                `You already have ${currentPlan} access`
            ).toResponse();
        }

        // Validate universal promo code
        const isValid = validatePromoCode(promoCode);

        if (!isValid) {
            return new ChatSDKError(
                "bad_request:api",
                "Invalid promo code"
            ).toResponse();
        }

        // Get trial duration for this promo code
        const trialDays = getPromoCodeTrialDays(promoCode);

        // Activate trial with dynamic duration
        const { trialEndsAt } = await activateTrial(user.id, promoCode, trialDays);

        return Response.json({
            success: true,
            plan: "trial",
            trialEndsAt: trialEndsAt.toISOString(),
            message: `Trial activated! You have ${trialDays} days of premium access.`,
        });
    } catch (error) {
        console.error("Promo code error:", error);

        if (error instanceof ChatSDKError) {
            return error.toResponse();
        }

        return new ChatSDKError(
            "bad_request:api",
            "Failed to activate promo code"
        ).toResponse();
    }
}
