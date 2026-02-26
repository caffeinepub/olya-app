// Module-level singleton for app language preference
const STORAGE_KEY = 'olya-app-language';

// Read initial value from localStorage
let currentLanguage: string = localStorage.getItem(STORAGE_KEY) ?? 'en';

// Set of listener callbacks — each mounted hook instance registers one
const listeners = new Set<(lang: string) => void>();

/**
 * Broadcast a new language to all registered listeners.
 * Always writes to localStorage first so any late-mounting component
 * that reads storage gets the updated value.
 */
function broadcastLanguage(lang: string): void {
  if (lang === currentLanguage) return; // no-op for same value
  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  // Iterate over a snapshot so mutations during iteration are safe
  Array.from(listeners).forEach((cb) => cb(lang));
}

import { useState, useEffect } from 'react';

export function useAppLanguagePreference() {
  const [language, setLanguageState] = useState<string>(() => currentLanguage);

  useEffect(() => {
    // Sync in case the language changed between render and effect
    if (language !== currentLanguage) {
      setLanguageState(currentLanguage);
    }

    const listener = (lang: string) => {
      setLanguageState(lang);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setAppLanguage = (lang: string) => {
    broadcastLanguage(lang);
  };

  return {
    language,
    appLanguage: language, // alias for backward-compat
    setAppLanguage,
  };
}
