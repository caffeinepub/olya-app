import { useAppLanguagePreference } from './useAppLanguagePreference';
import { getTranslation } from '../i18n/translations';

/**
 * Custom hook that provides a translation function `t` based on the current
 * app language preference. Re-renders automatically when the language changes
 * via the useAppLanguagePreference singleton listener mechanism.
 *
 * Fallback chain: selected language → English → key string.
 */
export function useTranslation() {
  const { language } = useAppLanguagePreference();

  const lang: string = language ?? 'en';

  const t = (key: string): string => {
    return getTranslation(key, lang);
  };

  return { t, language: lang };
}
