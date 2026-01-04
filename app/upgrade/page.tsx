"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTokenContext } from "@/components/token-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function UpgradePage() {
    const router = useRouter();
    const { token } = useTokenContext();
    const [promoCode, setPromoCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handlePromoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode.trim()) {
            toast.error("Please enter a promo code");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/stripe/promo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-privy-token": token || "",
                },
                body: JSON.stringify({ promoCode: promoCode.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid promo code");
            }

            toast.success(data.message || "Trial activated!");
            router.push("/");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to apply promo code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-privy-token": token || "",
                },
                body: JSON.stringify({ returnUrl: window.location.origin }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to start checkout");
            }

            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to start checkout");
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Upgrade to Premium</h1>
                    <p className="mt-2 text-muted-foreground">
                        Unlock unlimited messages, chats, and future premium features
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="bg-card border rounded-xl p-6 shadow-lg">
                    <div className="text-center mb-6">
                        <div className="text-4xl font-bold">$30</div>
                        <div className="text-sm text-muted-foreground">per month (~$1/day)</div>
                    </div>

                    <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Unlimited messages</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Unlimited chats</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Priority support</span>
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                            <span>🔜</span>
                            <span>Global memory (coming soon)</span>
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                            <span>🔜</span>
                            <span>File uploads (coming soon)</span>
                        </li>
                    </ul>

                    <Button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="w-full"
                        size="lg"
                    >
                        {isCheckingOut ? "Redirecting..." : "Subscribe Now"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-3">
                        Secure payment via Stripe • Card or Crypto (USDT/USDC)
                    </p>
                </div>

                {/* Promo Code Section */}
                <div className="bg-card/50 border rounded-xl p-6">
                    <h2 className="font-semibold mb-3">Have a promo code?</h2>
                    <form onSubmit={handlePromoSubmit} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button type="submit" variant="secondary" disabled={isLoading}>
                            {isLoading ? "..." : "Apply"}
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-2">
                        Format: WEF2026PRIVY + last 5 chars of your token
                    </p>
                </div>

                {/* Back Link */}
                <div className="text-center">
                    <Button variant="ghost" onClick={() => router.push("/")}>
                        ← Back to chat
                    </Button>
                </div>
            </div>
        </div>
    );
}
