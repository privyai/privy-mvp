import "server-only";
import Stripe from "stripe";

// Initialize Stripe client
// biome-ignore lint: Forbidden non-null assertion.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

// Price ID for premium subscription ($30/month)
export const PREMIUM_PRICE_ID = process.env.STRIPE_PRICE_ID || "";

/**
 * Create a Stripe Checkout session for premium subscription
 */
export async function createCheckoutSession({
    userId,
    returnUrl,
}: {
    userId: string;
    returnUrl: string;
}): Promise<{ url: string }> {
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: PREMIUM_PRICE_ID,
                quantity: 1,
            },
        ],
        success_url: `${returnUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}/upgrade?canceled=true`,
        metadata: {
            userId,
        },
    });

    if (!session.url) {
        throw new Error("Failed to create checkout session URL");
    }

    return { url: session.url };
}

/**
 * Validate WEF promo code
 * Universal format: WEF2026PRIVY (case-insensitive)
 */
export function validatePromoCode(promoCode: string): boolean {
    const validCodes = ["WEF2026PRIVY", "WEF2026", "PRIVYLAUNCH"];
    return validCodes.some(
        (code) => promoCode.toUpperCase().trim() === code.toUpperCase()
    );
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelSubscription(
    subscriptionId: string
): Promise<void> {
    await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get customer's active subscription
 */
export async function getActiveSubscription(
    customerId: string
): Promise<Stripe.Subscription | null> {
    const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
    });

    return subscriptions.data[0] || null;
}

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(
    userId: string
): Promise<Stripe.Customer> {
    return await stripe.customers.create({
        metadata: { userId },
    });
}
