"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CrownIcon,
  BrainIcon,
  InfinityIcon,
  ImageIcon,
  TimerIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";
import { useTokenContext } from "@/components/token-provider";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: "free" | "trial" | "premium";
}

const features = [
  {
    icon: BrainIcon,
    title: "Global Memory",
    description: "AI remembers your context across all sessions",
  },
  {
    icon: InfinityIcon,
    title: "Unlimited Messages",
    description: "No daily message limits or chat caps",
  },
  {
    icon: ImageIcon,
    title: "File Uploads",
    description: "Share images and documents with your coach",
  },
  {
    icon: TimerIcon,
    title: "Auto-Vanish",
    description: "Configurable automatic data deletion",
  },
];

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = "free",
}: UpgradeModalProps) {
  const [promoCode, setPromoCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { token } = useTokenContext();

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-privy-token": token || "",
        },
        body: JSON.stringify({
          returnUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

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

      setSuccess(data.message || "Trial activated! Enjoy 7 days of premium access.");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid promo code");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentPlan === "premium") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CrownIcon className="h-5 w-5 text-yellow-500" />
              You're a Premium Member
            </DialogTitle>
            <DialogDescription>
              Thank you for your support! You have access to all premium features.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CrownIcon className="h-6 w-6 text-yellow-500" />
            Upgrade to Privy Premium
          </DialogTitle>
          <DialogDescription>
            Unlock the full power of your AI performance coach
          </DialogDescription>
        </DialogHeader>

        {/* Features */}
        <div className="space-y-3 py-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="text-center py-4 border-y">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">$30</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pay with card or crypto
          </p>
        </div>

        {/* Error/Success Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckIcon className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Promo Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Have a promo code?</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="font-mono"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              onClick={handlePromoCode}
              disabled={!promoCode.trim() || isLoading}
            >
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : "Apply"}
            </Button>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Subscribe Now"
          )}
        </Button>

        {/* Trial Note */}
        {currentPlan === "trial" && (
          <p className="text-xs text-center text-muted-foreground">
            Your trial is active. Subscribe to continue after it ends.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
