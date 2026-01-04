"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BrainIcon,
  TimerIcon,
  FlameIcon,
  Loader2Icon,
  CheckIcon,
  LockIcon,
} from "lucide-react";
import { useTokenContext } from "@/components/token-provider";

interface UserSettings {
  globalMemoryEnabled: boolean;
  autoVanishEnabled: boolean;
  autoVanishDays: number;
  hardBurnEnabled: boolean;
}

interface PremiumSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isPremium: boolean;
}

const autoVanishOptions = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

export function PremiumSettings({
  isOpen,
  onClose,
  isPremium,
}: PremiumSettingsProps) {
  const { token } = useTokenContext();
  const [settings, setSettings] = useState<UserSettings>({
    globalMemoryEnabled: true,
    autoVanishEnabled: false,
    autoVanishDays: 30,
    hardBurnEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on open
  useEffect(() => {
    if (isOpen && token) {
      fetchSettings();
    }
  }, [isOpen, token]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        headers: { "x-privy-token": token || "" },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (
    key: keyof UserSettings,
    value: boolean | number
  ) => {
    if (!isPremium) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaveSuccess(false);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-privy-token": token || "",
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Premium Settings</SheetTitle>
          <SheetDescription>
            Configure your premium features and data retention preferences.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {saveSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Settings saved
                </AlertDescription>
              </Alert>
            )}

            {/* Global Memory */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainIcon className="h-4 w-4 text-primary" />
                  <Label htmlFor="globalMemory" className="font-medium">
                    Global Memory
                  </Label>
                </div>
                {isPremium ? (
                  <Switch
                    id="globalMemory"
                    checked={settings.globalMemoryEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("globalMemoryEnabled", checked)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Allow the AI to remember insights and context from your previous
                sessions for more personalized coaching.
              </p>
            </div>

            {/* Auto-Vanish */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TimerIcon className="h-4 w-4 text-primary" />
                  <Label htmlFor="autoVanish" className="font-medium">
                    Auto-Vanish
                  </Label>
                </div>
                {isPremium ? (
                  <Switch
                    id="autoVanish"
                    checked={settings.autoVanishEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("autoVanishEnabled", checked)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically delete old conversations and memories after a set
                period.
              </p>

              {settings.autoVanishEnabled && isPremium && (
                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">
                    Delete after
                  </Label>
                  <Select
                    value={String(settings.autoVanishDays)}
                    onValueChange={(value) =>
                      updateSetting("autoVanishDays", Number(value))
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {autoVanishOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Hard Burn */}
            <div className="space-y-3 border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlameIcon className="h-4 w-4 text-destructive" />
                  <Label htmlFor="hardBurn" className="font-medium">
                    Hard Burn Mode
                  </Label>
                </div>
                {isPremium ? (
                  <Switch
                    id="hardBurn"
                    checked={settings.hardBurnEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("hardBurnEnabled", checked)
                    }
                    disabled={isSaving}
                  />
                ) : (
                  <LockIcon className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, data is immediately and permanently deleted when
                you burn a chat. No recovery possible.
              </p>
            </div>

            {/* Upgrade CTA for non-premium */}
            {!isPremium && (
              <div className="border-t pt-6">
                <Alert>
                  <LockIcon className="h-4 w-4" />
                  <AlertDescription>
                    Premium settings require an active subscription. Upgrade to
                    unlock these features.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
