"use client";

import { useToken } from "@/hooks/use-token";
import { TokenDisplay } from "@/components/token-display";
import { ImportToken } from "@/components/import-token";

interface TokenProviderProps {
  children: React.ReactNode;
}

export function TokenProvider({ children }: TokenProviderProps) {
  const {
    token,
    isFirstTime,
    isLoading,
    acknowledgeToken,
    copyToken,
    downloadToken,
    importToken,
  } = useToken();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
      </div>
    );
  }

  return (
    <>
      {token && isFirstTime && (
        <TokenDisplay
          token={token}
          isOpen={isFirstTime}
          onAcknowledge={acknowledgeToken}
          onCopy={copyToken}
          onDownload={downloadToken}
        />
      )}

      {children}

      {/* Token import available from header/sidebar */}
      <div className="hidden">
        <ImportToken onImport={importToken} />
      </div>
    </>
  );
}
