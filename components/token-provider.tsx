"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useToken } from "@/hooks/use-token";

interface TokenUser {
  id: string;
}

interface TokenContextValue {
  user: TokenUser | null;
  token: string | null;
  isLoading: boolean;
  isFirstTime: boolean;
  acknowledgeToken: () => void;
  copyToken: () => Promise<boolean>;
  downloadToken: () => void;
  logout: () => void;
  importToken: (token: string) => boolean;
  burnAccount: () => Promise<boolean>;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export function useTokenContext() {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error("useTokenContext must be used within TokenProvider");
  }
  return context;
}

interface TokenProviderProps {
  children: React.ReactNode;
}

export function TokenProvider({ children }: TokenProviderProps) {
  const {
    token,
    hasToken,
    isFirstTime,
    needsImport,
    isLoading,
    acknowledgeToken,
    copyToken,
    downloadToken,
    logout,
    importToken,
  } = useToken();

  const [user, setUser] = useState<TokenUser | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  // Validate token with server and get/create user
  useEffect(() => {
    async function validateAndGetUser() {
      if (!token) {
        setUser(null);
        setIsValidating(false);
        return;
      }

      try {
        // Make a request to validate token and get user ID
        // The history endpoint will create the user if they don't exist
        const response = await fetch("/api/history?limit=1", {
          headers: {
            "x-privy-token": token,
          },
        });

        if (response.ok) {
          // Token is valid, user exists or was created
          // We don't get user ID back, but we know they're authenticated
          // Use a hash of the token as a display ID (first 8 chars)
          setUser({ id: token.substring(0, 8) });
        } else {
          // Token invalid, clear it
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to validate token:", error);
        setUser(null);
      } finally {
        setIsValidating(false);
      }
    }

    if (!isLoading && hasToken) {
      validateAndGetUser();
    } else if (!isLoading) {
      setIsValidating(false);
    }
  }, [token, isLoading, hasToken]);

  // Burn account - delete all user data
  const burnAccount = async (): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "x-privy-token": token,
        },
      });

      if (response.ok) {
        // Clear local token and reload
        logout();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to burn account:", error);
      return false;
    }
  };

  const contextValue: TokenContextValue = {
    user,
    token,
    isLoading: isLoading || isValidating,
    isFirstTime,
    acknowledgeToken,
    copyToken,
    downloadToken,
    logout,
    importToken,
    burnAccount,
  };

  return (
    <TokenContext.Provider value={contextValue}>
      {contextValue.isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
        </div>
      ) : (
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
          {needsImport && (
            <TokenImportModal
              isOpen={needsImport}
              onImport={importToken}
            />
          )}
          {children}
        </>
      )}
    </TokenContext.Provider>
  );
}

// Import TokenDisplay and TokenImportModal inline to avoid circular deps
import { TokenDisplay } from "@/components/token-display";
import { TokenImportModal } from "@/components/token-import-modal";
