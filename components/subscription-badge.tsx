"use client";

import { Badge } from "@/components/ui/badge";
import { CrownIcon, ClockIcon, SparklesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionBadgeProps {
  plan: "free" | "trial" | "premium";
  trialDaysLeft?: number | null;
  onClick?: () => void;
  className?: string;
}

export function SubscriptionBadge({
  plan,
  trialDaysLeft,
  onClick,
  className,
}: SubscriptionBadgeProps) {
  if (plan === "premium") {
    return (
      <Badge
        variant="default"
        className={cn(
          "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 cursor-pointer gap-1",
          className
        )}
        onClick={onClick}
      >
        <CrownIcon className="h-3 w-3" />
        Premium
      </Badge>
    );
  }

  if (plan === "trial" && trialDaysLeft !== null && trialDaysLeft !== undefined) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "cursor-pointer gap-1",
          trialDaysLeft <= 2 && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
          className
        )}
        onClick={onClick}
      >
        <ClockIcon className="h-3 w-3" />
        Trial ({trialDaysLeft}d)
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("cursor-pointer gap-1 hover:bg-accent", className)}
      onClick={onClick}
    >
      <SparklesIcon className="h-3 w-3" />
      Upgrade
    </Badge>
  );
}
