"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

/**
 * Static chat preview component for landing page hero section
 * Shows 3 sample messages demonstrating Decision Lab mode
 * Clicking anywhere takes user to /chat
 */

const sampleMessages = [
    {
        role: "assistant" as const,
        content:
            "What's the decision you're stuck on, and what's the real constraint?",
    },
    {
        role: "user" as const,
        content:
            "I'm debating whether to cut burn hard or extend runway with a bridge that changes control.",
    },
    {
        role: "assistant" as const,
        content:
            'Let\'s map it. Two paths, three risks, and one "non-negotiable." What\'s the non-negotiable?',
    },
];

export function ChatPreview() {
    return (
        <Link href="/chat" className="group block">
            <div className="relative w-full max-w-md cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur transition-all duration-300 hover:border-zinc-600 hover:shadow-orange-500/10 group-hover:scale-[1.02]">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                            <span className="text-sm">🔒</span>
                        </div>
                        <div>
                            <span className="font-medium text-sm text-zinc-100">Privy</span>
                            <p className="text-muted-foreground text-xs">Decision Lab</p>
                        </div>
                    </div>
                    <Button
                        className="pointer-events-none gap-1.5 bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:bg-orange-700 hover:shadow-[0_0_20px_rgba(234,88,12,0.6)]"
                        size="sm"
                        variant="destructive"
                    >
                        Burn <Flame className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                    {sampleMessages.map((msg, i) => (
                        <div
                            className={`rounded-lg p-3 text-sm ${msg.role === "assistant"
                                ? "bg-zinc-800 text-zinc-200"
                                : "ml-4 bg-zinc-700 text-zinc-100"
                                }`}
                            key={i}
                        >
                            {msg.content}
                        </div>
                    ))}
                </div>

                {/* Mode indicator */}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Mode:</span>
                        <Badge className="text-xs" variant="outline">
                            Decision Lab
                        </Badge>
                    </div>
                </div>

                {/* Input mock */}
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-muted-foreground text-sm">
                        Type here...
                    </div>
                    <Button
                        className="pointer-events-none shrink-0"
                        size="sm"
                        variant="secondary"
                    >
                        Send →
                    </Button>
                </div>



                {/* Click hint overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition-all duration-300 group-hover:bg-black/20">
                    <span className="rounded-lg bg-black/70 px-4 py-2 font-medium text-sm text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        Click to start chatting →
                    </span>
                </div>
            </div>
        </Link>
    );
}
