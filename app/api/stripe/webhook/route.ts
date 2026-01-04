import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import {
    getUserByStripeCustomerId,
    isStripeEventProcessed,
    linkStripeCustomer,
    logSubscriptionEvent,
    updateUserPlan,
} from "@/lib/db/queries";
import type Stripe from "stripe";

// Disable body parsing for Stripe webhook validation

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Security: Require webhook secret to be configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return new Response("Webhook not configured", { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Webhook signature verification failed", {
            status: 400,
        });
    }

    try {
        // Idempotency: Skip if already processed
        if (await isStripeEventProcessed(event.id)) {
            console.log(`Event ${event.id} already processed, skipping`);
            return new Response("OK", { status: 200 });
        }

        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;

                if (userId && session.customer) {
                    // Link Stripe customer to user
                    await linkStripeCustomer(userId, session.customer as string);
                    // Upgrade to premium
                    await updateUserPlan(userId, "premium");
                    // Log event for idempotency
                    await logSubscriptionEvent({
                        userId,
                        eventType: event.type,
                        newPlan: "premium",
                        stripeEventId: event.id,
                    });
                    console.log(`User ${userId} upgraded to premium`);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const user = await getUserByStripeCustomerId(customerId);

                if (user) {
                    if (subscription.status === "active") {
                        await updateUserPlan(user.id, "premium");
                    } else if (
                        subscription.status === "canceled" ||
                        subscription.status === "unpaid"
                    ) {
                        await updateUserPlan(user.id, "free");
                    }
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;
                const user = await getUserByStripeCustomerId(customerId);

                if (user) {
                    await updateUserPlan(user.id, "free");
                    console.log(`User ${user.id} subscription canceled - downgraded to free`);
                }
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                const user = await getUserByStripeCustomerId(customerId);

                if (user) {
                    console.warn(`Payment failed for user ${user.id}`);
                    // Optionally downgrade immediately or send notification
                }
                break;
            }

            default:
                // Unhandled event type
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response("Webhook processing error", { status: 500 });
    }
}
