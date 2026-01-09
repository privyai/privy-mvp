"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  KeyIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  LockIcon,
  EyeOffIcon,
  KeySquareIcon,
} from "lucide-react";

interface TokenImportModalProps {
  isOpen: boolean;
  onImport: (token: string) => boolean;
}

export function TokenImportModal({
  isOpen,
  onImport,
}: TokenImportModalProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    setError(null);
    setIsImporting(true);

    const success = onImport(tokenInput);

    if (success) {
      // Success - the provider will handle the state change
      window.location.reload();
    } else {
      setError(
        "Invalid token format. Please check and try again. Token should be 64 hexadecimal characters."
      );
      setIsImporting(false);
    }
  };

  const isValidLength = tokenInput.replace(/\s/g, "").length === 64;

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90dvh] overflow-y-auto" hideClose>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <KeyIcon className="h-7 w-7 text-primary" />
            Welcome Back to Privy
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter the access token you saved when you first signed up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* What is my token? Explainer */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold mb-3 text-base">What is my token?</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Your token is a <strong>64-character secret key</strong> that was generated
              when you first visited Privy. You should have saved it by copying or downloading it.
            </p>
            <p className="text-sm text-muted-foreground">
              It looks something like this:
            </p>
            <code className="block mt-2 p-2 bg-background rounded border text-xs font-mono break-all">
              a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
            </code>
          </div>

          {/* Token Input */}
          <div>
            <label
              htmlFor="token-input"
              className="block text-sm font-medium mb-2"
            >
              Paste Your Token
            </label>
            <Textarea
              id="token-input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your 64-character token here..."
              className="font-mono text-sm min-h-[80px]"
              autoFocus
            />
            {tokenInput && (
              <p className="text-xs text-muted-foreground mt-1">
                {tokenInput.replace(/\s/g, "").length} / 64 characters
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* How it works - Visual explainer */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              How Your Token Protects You
            </h4>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                  <KeySquareIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong className="block">Your Key, Your Identity</strong>
                  <span className="text-muted-foreground">
                    The token identifies you without email, password, or personal info.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                  <LockIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong className="block">Encrypts Your Messages</strong>
                  <span className="text-muted-foreground">
                    Your conversations are encrypted using your token. Without it, even we can't read them.
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                  <EyeOffIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <strong className="block">Never Stored on Our Servers</strong>
                  <span className="text-muted-foreground">
                    We only store a one-way hash. Your actual token stays with you, always.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lost Token Warning */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm">
              <strong className="text-destructive">Lost your token?</strong>{" "}
              <span className="text-muted-foreground">
                Unfortunately, we cannot recover it - that's what makes it secure.
                You'll need to start fresh with a new account.
              </span>
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-2">
          <Button
            onClick={handleImport}
            disabled={!isValidLength || isImporting}
            size="lg"
            className="w-full"
          >
            {isImporting ? "Verifying..." : "Continue with Token"}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              // Clear ALL token-related storage to start fresh
              localStorage.removeItem("privy_has_token");
              localStorage.removeItem("privy_token_seen");
              localStorage.removeItem("privy_last_activity");
              localStorage.removeItem("privy_token_created");
              sessionStorage.removeItem("privy_access_token");
              // Force full navigation (not just reload) to ensure fresh state
              window.location.href = window.location.pathname;
            }}
          >
            Lost Token? Create New Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
