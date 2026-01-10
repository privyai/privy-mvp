import "server-only";
import Stripe from "stripe";

// Lazy initialization to avoid build-time errors when env vars aren't available
let _stripe: Stripe | null = null;

function getStripeClient(): Stripe {
    if (!_stripe) {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error("STRIPE_SECRET_KEY environment variable is not configured");
        }
        _stripe = new Stripe(secretKey, {
            apiVersion: "2025-12-15.clover",
        });
    }
    return _stripe;
}

// Export getter for stripe client (lazy loaded)
export const stripe = new Proxy({} as Stripe, {
    get(_, prop) {
        return (getStripeClient() as any)[prop];
    },
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
        // Accept both card and stablecoin (USDC on Base, Polygon, Ethereum, Solana)
        // Crypto requires enabling in Stripe Dashboard: Settings > Payments > Payment methods
        payment_method_types: ["card", "crypto"],
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
 * Promo codes with their trial durations
 */
const PROMO_CODES: Record<string, number> = {
    "WEF2026PRIVY": 14, // 14-day trial
    "WEF2026": 7,       // 7-day trial
    "PRIVYLAUNCH": 3,   // 3-day trial
};

/**
 * Validate promo code and return trial days (0 if invalid)
 */
export function validatePromoCode(promoCode: string): boolean {
    const normalizedCode = promoCode.toUpperCase().trim();
    return normalizedCode in PROMO_CODES;
}

/**
 * Get trial duration for a promo code (defaults to 7 days)
 */
export function getPromoCodeTrialDays(promoCode: string): number {
    const normalizedCode = promoCode.toUpperCase().trim();
    return PROMO_CODES[normalizedCode] || 7;
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
