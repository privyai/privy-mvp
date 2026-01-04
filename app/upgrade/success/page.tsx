"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Auto-redirect after 5 seconds
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Success Icon */}
                <div className="text-6xl">🎉</div>

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-green-500">
                        Welcome to Premium!
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Your subscription is now active. Enjoy unlimited access!
                    </p>
                </div>

                {/* Features Unlocked */}
                <div className="bg-card border rounded-xl p-6 text-left">
                    <h2 className="font-semibold mb-3">What you unlocked:</h2>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Global Memory - AI remembers your context</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Unlimited messages per day</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Unlimited chat sessions</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>File uploads for coaching context</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Auto-vanish data retention settings</span>
                        </li>
                    </ul>
                </div>

                {/* Auto-redirect notice */}
                <p className="text-sm text-muted-foreground">
                    Redirecting to chat in {countdown} seconds...
                </p>

                {/* Manual redirect button */}
                <Button onClick={() => router.push("/")} className="w-full" size="lg">
                    Start Chatting →
                </Button>
            </div>
        </div>
    );
}

export default function UpgradeSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🎉</div>
                        <p>Loading...</p>
                    </div>
                </div>
            }
        >
            <SuccessContent />
        </Suspense>
    );
}
