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
import { formatTokenForDisplay } from "@/lib/auth/token-client";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  KeyIcon,
  ShieldCheckIcon,
  LockIcon,
  EyeOffIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface TokenDisplayProps {
  token: string;
  isOpen: boolean;
  onAcknowledge: () => void;
  onCopy: () => Promise<boolean>;
  onDownload: () => void;
  onSwitchToImport?: () => void;
}

export function TokenDisplay({
  token,
  isOpen,
  onAcknowledge,
  onCopy,
  onDownload,
  onSwitchToImport,
}: TokenDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    onDownload();
    setDownloaded(true);
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  const tokenChunks = formatTokenForDisplay(token);
  const hasSaved = copied || downloaded;

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90dvh] overflow-y-auto" hideClose>
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <KeyIcon className="h-7 w-7 text-primary" />
            Your Private Access Token
          </DialogTitle>
          <DialogDescription className="text-base">
            We just generated a unique token for you. This is your <strong>key to Privy</strong> -
            save it now, you'll need it to log in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* What is this? */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold mb-2 text-base">What is this token?</h4>
            <p className="text-sm text-muted-foreground">
              Instead of email and password, Privy uses this <strong>64-character secret key</strong> to
              identify you. It's like a master password that also encrypts your conversations.
              No personal information required.
            </p>
          </div>

          {/* Token Display */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Token (save this!)
            </label>
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="font-mono text-sm break-all leading-relaxed select-all">
                {tokenChunks.map((chunk, i) => (
                  <span key={i} className="inline-block mr-2 mb-1">
                    {chunk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Save Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant={copied ? "default" : "outline"}
              className="flex-1"
              size="lg"
            >
              {copied ? (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              variant={downloaded ? "default" : "outline"}
              className="flex-1"
              size="lg"
            >
              {downloaded ? (
                <>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Download as File
                </>
              )}
            </Button>
          </div>

          {/* How it protects you */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              How Your Token Protects You
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-3">
                <LockIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Encrypts your messages</strong> - only you can read them
                </span>
              </div>
              <div className="flex items-center gap-3">
                <EyeOffIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Never stored on our servers</strong> - we only keep a hash
                </span>
              </div>
              <div className="flex items-center gap-3">
                <KeyIcon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  <strong className="text-foreground">Your identity, zero personal info</strong> - completely anonymous
                </span>
              </div>
            </div>
          </div>

          {/* Critical Warning */}
          <div className="rounded-lg border-2 border-destructive/50 bg-destructive/5 p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
              <AlertTriangleIcon className="h-5 w-5" />
              Critical: Save This Token Now
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">This screen won't appear again</strong> - save before continuing
              </li>
              <li>
                <strong className="text-foreground">No recovery possible</strong> - we can't retrieve your token
              </li>
              <li>
                <strong className="text-foreground">Lose it = lose your data</strong> - encrypted chats become inaccessible
              </li>
            </ul>
          </div>

          {/* Acknowledgment */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/30">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <label htmlFor="acknowledge" className="text-sm cursor-pointer">
              I have saved my token and understand that Privy cannot recover it if I lose it.
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 mt-2">
          <Button
            onClick={handleAcknowledge}
            disabled={!acknowledged || !hasSaved}
            size="lg"
            className="w-full"
          >
            {!hasSaved
              ? "Save Your Token First"
              : !acknowledged
              ? "Check the Box Above"
              : "Continue to Privy"}
          </Button>
          {onSwitchToImport && (
            <button
              type="button"
              onClick={onSwitchToImport}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Already have a token? Import existing
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

