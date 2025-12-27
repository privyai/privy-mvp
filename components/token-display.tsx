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
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";

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
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    const success = await onCopy();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  const tokenChunks = formatTokenForDisplay(token);

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[600px]" hideClose>
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Your Private Access Token
          </DialogTitle>
          <DialogDescription className="text-base">
            This is your <strong>only way</strong> to access your Privy chats.
            We cannot recover it if you lose it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Display */}
          <div className="rounded-lg border-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-4">
            <div className="font-mono text-sm break-all leading-relaxed">
              {tokenChunks.map((chunk, i) => (
                <span key={i} className="inline-block mr-2 mb-1">
                  {chunk}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
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
                  Copy Token
                </>
              )}
            </Button>

            <Button
              onClick={onDownload}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              <span className="mr-2 text-xl">⚠️</span>
              Important Privacy Notice
            </h4>
            <ul className="text-sm space-y-1 ml-6 list-disc">
              <li>
                <strong>Save this token now</strong> - it won't be shown again
              </li>
              <li>
                <strong>No recovery</strong> - we don't store your token, only
                a hash
              </li>
              <li>
                <strong>One token = one identity</strong> - lose it, lose your
                chats
              </li>
              <li>
                <strong>Don't share it</strong> - anyone with this token can
                access your sessions
              </li>
            </ul>
          </div>

          {/* Acknowledgment */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="acknowledge" className="text-sm cursor-pointer">
              I understand that I'm responsible for keeping this token safe, and
              that Privy cannot recover it if I lose it.
            </label>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={handleAcknowledge}
            disabled={!acknowledged}
            size="lg"
            className="w-full"
          >
            I've Saved My Token - Continue to Privy
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

