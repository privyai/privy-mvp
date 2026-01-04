"use client";

import { useState, useEffect } from "react";
import { ChevronUp, CrownIcon, SettingsIcon, CreditCardIcon } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTokenContext } from "./token-provider";
import { SubscriptionBadge } from "./subscription-badge";
import { UpgradeModal } from "./upgrade-modal";
import { PremiumSettings } from "./premium-settings";

type PlanType = "free" | "trial" | "premium";

interface SubscriptionStatus {
  plan: PlanType;
  isPremium: boolean;
  trialDaysLeft: number | null;
  hasStripeCustomer: boolean;
}

export function SidebarUserNav() {
  const { user, token, copyToken, downloadToken } = useTokenContext();
  const { setTheme, resolvedTheme } = useTheme();

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    plan: "free",
    isPremium: false,
    trialDaysLeft: null,
    hasStripeCustomer: false,
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Fetch subscription status on mount
  useEffect(() => {
    if (token) {
      fetchSubscriptionStatus();
    }
  }, [token]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch("/api/stripe/status", {
        headers: { "x-privy-token": token || "" },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus({
          plan: data.plan,
          isPremium: data.isPremium,
          trialDaysLeft: data.trialDaysLeft,
          hasStripeCustomer: data.hasStripeCustomer,
        });
      }
    } catch (error) {
      console.error("Failed to fetch subscription status:", error);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/stripe/manage", {
        headers: { "x-privy-token": token || "" },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open subscription management:", error);
    }
  };

  if (!user) return null;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="h-10 bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
              >
                <Image
                  alt="Anonymous User"
                  className="rounded-full"
                  height={24}
                  src={`https://avatar.vercel.sh/${user.id}`}
                  width={24}
                />
                <span className="truncate flex items-center gap-2" data-testid="user-email">
                  Anonymous
                  <SubscriptionBadge
                    plan={subscriptionStatus.plan}
                    trialDaysLeft={subscriptionStatus.trialDaysLeft}
                  />
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-popper-anchor-width)"
              data-testid="user-nav-menu"
              side="top"
            >
              {/* Subscription Actions */}
              {subscriptionStatus.isPremium ? (
                <>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => setShowSettings(true)}
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Premium Settings
                  </DropdownMenuItem>
                  {subscriptionStatus.hasStripeCustomer && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onSelect={handleManageSubscription}
                    >
                      <CreditCardIcon className="mr-2 h-4 w-4" />
                      Manage Subscription
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer text-primary"
                  onSelect={() => setShowUpgradeModal(true)}
                >
                  <CrownIcon className="mr-2 h-4 w-4" />
                  Upgrade to Premium
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />

              {/* Theme Toggle */}
              <DropdownMenuItem
                className="cursor-pointer"
                data-testid="user-nav-item-theme"
                onSelect={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
              >
                {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {/* Token Management */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={async () => {
                  const success = await copyToken();
                  if (success) {
                    // Toast is handled in copyToken
                  }
                }}
              >
                Copy Access Token
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => downloadToken()}
              >
                Download Access Token
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Modals */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscriptionStatus.plan}
      />
      <PremiumSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isPremium={subscriptionStatus.isPremium}
      />
    </>
  );
}
