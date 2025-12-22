"use client";

import { useEffect, useState } from "react";
import {
  getOrCreateToken,
  getStoredToken,
  storeToken,
  clearToken,
  hasSeenToken,
  markTokenAsSeen,
  copyTokenToClipboard,
  downloadTokenAsFile,
  importToken as importTokenUtil,
} from "@/lib/auth/token-client";

export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get or create token on mount
    const storedToken = getStoredToken();

    if (storedToken) {
      setToken(storedToken);
      setHasToken(true);
      setIsFirstTime(false);
    } else {
      // First time user - generate new token
      const newToken = getOrCreateToken();
      setToken(newToken);
      setHasToken(true);
      setIsFirstTime(!hasSeenToken());
    }

    setIsLoading(false);
  }, []);

  const acknowledgeToken = () => {
    markTokenAsSeen();
    setIsFirstTime(false);
  };

  const copyToken = async () => {
    if (!token) return false;
    return await copyTokenToClipboard(token);
  };

  const downloadToken = () => {
    if (!token) return;
    downloadTokenAsFile(token);
  };

  const logout = () => {
    clearToken();
    setToken(null);
    setHasToken(false);
    setIsFirstTime(false);
    // Reload to generate new token
    window.location.reload();
  };

  const importToken = (tokenString: string): boolean => {
    const importedToken = importTokenUtil(tokenString);

    if (!importedToken) {
      return false;
    }

    storeToken(importedToken);
    setToken(importedToken);
    setHasToken(true);
    setIsFirstTime(false);
    return true;
  };

  return {
    token,
    hasToken,
    isFirstTime,
    isLoading,
    acknowledgeToken,
    copyToken,
    downloadToken,
    logout,
    importToken,
  };
}
