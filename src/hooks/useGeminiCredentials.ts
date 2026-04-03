import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'the_living_archive_gemini_key';

/**
 * Custom hook for managing Gemini API credentials.
 * Handles storage in localStorage and provides reactivity for the UI.
 */
export function useGeminiCredentials() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const [isReady, setIsReady] = useState<boolean>(!!apiKey);

  // Sync state with localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setApiKey(e.newValue);
        setIsReady(!!e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveKey = useCallback((key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      localStorage.setItem(STORAGE_KEY, trimmedKey);
      setApiKey(trimmedKey);
      setIsReady(true);
    }
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setIsReady(false);
  }, []);

  return {
    apiKey,
    isReady,
    saveKey,
    clearKey
  };
}
