import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'ocean-teal' | 'midnight-slate' | 'ember-amber' | 'forest-green';

export interface ThemeState {
  currentTheme: ThemeName;
  currentMode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = 'olya-color-theme';
const MODE_STORAGE_KEY = 'olya-theme-mode';

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  // Remove all theme data attributes
  root.removeAttribute('data-theme');
  if (theme !== 'ocean-teal') {
    root.setAttribute('data-theme', theme);
  }
}

export function useTheme(): ThemeState {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'ocean-teal';
  });

  const [currentMode, setCurrentMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return (stored as ThemeMode) || 'dark';
  });

  // Apply on mount and whenever values change
  useEffect(() => {
    applyMode(currentMode);
  }, [currentMode]);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const setTheme = useCallback((theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  }, []);

  const setMode = useCallback((mode: ThemeMode) => {
    setCurrentMode(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    applyMode(mode);
  }, []);

  const toggleMode = useCallback(() => {
    setCurrentMode(prev => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(MODE_STORAGE_KEY, next);
      applyMode(next);
      return next;
    });
  }, []);

  return { currentTheme, currentMode, setTheme, toggleMode, setMode };
}
