"use client";

import { useEffect, useState } from "react";
import {
  generateTokenClient,
  getStoredToken,
  storeToken,
  clearToken,
  hasSeenToken,
  markTokenAsSeen,
  copyTokenToClipboard,
  downloadTokenAsFile,
  importToken as importTokenUtil,
  isReturningUser,
  isWithinGracePeriod,
  isTokenExpired,
  updateLastActivity,
} from "@/lib/auth/token-client";

export function useToken() {
  const [token, setToken] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [needsImport, setNeedsImport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in sessionStorage
    const storedToken = getStoredToken();
    const returning = isReturningUser();
    const withinGrace = isWithinGracePeriod();
    const expired = isTokenExpired();

    if (storedToken) {
      // Token exists in current session - use it
      setToken(storedToken);
      setHasToken(true);
      setIsFirstTime(false);
      setNeedsImport(false);
      updateLastActivity();
    } else if (returning && withinGrace && !expired) {
      // Returning user within 150s grace period - auto-generate (same behavior)
      // They haven't been away long enough to need re-auth
      const newToken = generateTokenClient();
      storeToken(newToken);
      setToken(newToken);
      setHasToken(true);
      setIsFirstTime(false);
      setNeedsImport(false);
    } else if (returning || expired) {
      // Returning user after grace period OR token expired - needs to import
      setToken(null);
      setHasToken(false);
      setIsFirstTime(false);
      setNeedsImport(true);
    } else {
      // First time user - generate new token
      const newToken = generateTokenClient();
      storeToken(newToken);
      setToken(newToken);
      setHasToken(true);
      setIsFirstTime(true);
      setNeedsImport(false);
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
    needsImport,
    isLoading,
    acknowledgeToken,
    copyToken,
    downloadToken,
    logout,
    importToken,
  };
}
