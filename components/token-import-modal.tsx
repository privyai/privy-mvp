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
import { KeyIcon, AlertCircleIcon } from "lucide-react";

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
      <DialogContent className="sm:max-w-[600px]" hideClose>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center">
            <KeyIcon className="mr-2 h-6 w-6" />
            Welcome Back to Privy
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter your private access token to continue. This token is stored
            only in your browser session and is required each time you open
            Privy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              placeholder="Enter your 64-character hexadecimal token..."
              className="font-mono text-sm min-h-[120px]"
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

          {/* Info Box */}
          <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="mr-2 text-xl">ℹ️</span>
              Zero-Trust Privacy
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>
                Your token is <strong>never</strong> stored permanently
              </li>
              <li>
                Closing your browser clears the session - you'll need to
                re-enter your token
              </li>
              <li>
                We only store a hash on our servers - your actual token stays
                with you
              </li>
              <li>
                This ensures maximum privacy - even we can't access your data
                without your token
              </li>
            </ul>
          </div>

          {/* Lost Token Help */}
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Lost your token?</strong> Unfortunately, we cannot recover
              it. You'll need to start fresh with a new token and account.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleImport}
            disabled={!isValidLength || isImporting}
            size="lg"
            className="w-full"
          >
            {isImporting ? "Importing..." : "Import Token & Continue"}
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
              window.location.reload();
            }}
          >
            Lost Token? Start Fresh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
