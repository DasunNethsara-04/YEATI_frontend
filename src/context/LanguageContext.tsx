import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';
import translations, { type Locale } from '../i18n/translations';

// ─── Storage key ──────────────────────────────────────────────────────────────
const STORAGE_KEY = 'agri_lang';

// ─── Helper: read locale from localStorage synchronously (no flash) ───────────
function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'si' || stored === 'ta') return stored;
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
  return 'en';
}

// ─── Context types ────────────────────────────────────────────────────────────
interface LanguageContextValue {
  language: Locale;
  setLanguage: (l: Locale) => void;
  /** Translate a dot-key. Falls back to the key itself if not found. */
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Locale>(readStoredLocale);

  const setLanguage = useCallback((l: Locale) => {
    setLanguageState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language]?.[key] ?? translations['en']?.[key] ?? key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
  return ctx;
};
