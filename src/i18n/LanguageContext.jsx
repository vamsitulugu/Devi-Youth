import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { en } from './en';
import { te } from './te';

const dictionaries = { en, te };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('gc_lang') || 'en');

  const changeLang = useCallback((next) => {
    setLang(next);
    localStorage.setItem('gc_lang', next);
  }, []);

  const t = useMemo(() => {
    const dict = dictionaries[lang] || dictionaries.en;
    // fall back to English for any missing key
    return (key) => dict[key] ?? dictionaries.en[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang: changeLang, t }), [lang, changeLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      <div lang={lang}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
