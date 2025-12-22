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
  DialogTrigger,
} from "@/components/ui/dialog";
import { KeyIcon, AlertCircleIcon } from "lucide-react";

interface ImportTokenProps {
  onImport: (token: string) => boolean;
}

export function ImportToken({ onImport }: ImportTokenProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);

    const success = onImport(tokenInput);

    if (success) {
      setIsOpen(false);
      setTokenInput("");
      // Reload to fetch chats with new token
      window.location.reload();
    } else {
      setError(
        "Invalid token format. Token should be 64 hexadecimal characters."
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <KeyIcon className="h-4 w-4" />
          Import Token
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Your Access Token</DialogTitle>
          <DialogDescription>
            Paste your Privy access token to restore access to your previous
            chats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="token-input"
              className="block text-sm font-medium mb-2"
            >
              Access Token
            </label>
            <textarea
              id="token-input"
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setError(null);
              }}
              placeholder="Paste your 64-character token here..."
              className="w-full h-32 p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-offset-2"
              spellCheck={false}
            />
            {error && (
              <div className="mt-2 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-3">
            <p className="text-sm">
              <strong>Note:</strong> Importing a token will replace your
              current session. Your current chats will only be accessible if you
              have your original token.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!tokenInput.trim()}>
            Import Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
