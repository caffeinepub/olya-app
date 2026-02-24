import { useState, useCallback } from 'react';

const STORAGE_KEY = 'olya-transcription-language';
const DEFAULT_LANGUAGE = 'auto';

function readFromStorage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function writeToStorage(value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore storage errors
  }
}

export function useLanguagePreference() {
  const [language, setLanguageState] = useState<string>(() => readFromStorage());

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    writeToStorage(code);
  }, []);

  const clearLanguage = useCallback(() => {
    setLanguageState(DEFAULT_LANGUAGE);
    writeToStorage(DEFAULT_LANGUAGE);
  }, []);

  return { language, setLanguage, clearLanguage };
}
