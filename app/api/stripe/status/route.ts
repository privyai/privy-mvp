import { authenticateToken } from "@/lib/auth/token-auth";
import { getUserPlan, isPremiumUser } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const authenticatedUser = await authenticateToken(request);

        if (!authenticatedUser) {
            return new ChatSDKError("unauthorized:chat").toResponse();
        }

        // Get full user data including subscription info
        const [userData] = await db
            .select({
                plan: user.plan,
                trialEndsAt: user.trialEndsAt,
                stripeCustomerId: user.stripeCustomerId,
            })
            .from(user)
            .where(eq(user.id, authenticatedUser.id));

        if (!userData) {
            return new ChatSDKError("not_found:user").toResponse();
        }

        // Get effective plan (checks trial expiry)
        const effectivePlan = await getUserPlan(authenticatedUser.id);
        const isPremium = await isPremiumUser(authenticatedUser.id);

        // Calculate trial status
        const isTrialExpired =
            userData.plan === "trial" &&
            userData.trialEndsAt &&
            new Date() > userData.trialEndsAt;

        const trialDaysLeft =
            userData.trialEndsAt && !isTrialExpired
                ? Math.ceil(
                      (userData.trialEndsAt.getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                  )
                : null;

        return Response.json({
            plan: effectivePlan,
            isPremium,
            trialEndsAt: userData.trialEndsAt?.toISOString() || null,
            isTrialExpired,
            trialDaysLeft,
            hasStripeCustomer: !!userData.stripeCustomerId,
            features: {
                globalMemory: isPremium,
                unlimitedMessages: effectivePlan === "premium",
                fileUploads: isPremium,
                autoVanish: isPremium,
            },
        });
    } catch (error) {
        console.error("Status error:", error);

        if (error instanceof ChatSDKError) {
            return error.toResponse();
        }

        return new ChatSDKError(
            "bad_request:api",
            "Failed to get subscription status"
        ).toResponse();
    }
}
