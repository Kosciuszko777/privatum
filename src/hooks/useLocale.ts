import { useState, useCallback } from 'react';
import { type Locale, setLocale as setI18nLocale, getLocale } from '@/lib/i18n';
import { de } from '@/lib/i18n/de';
import { en } from '@/lib/i18n/en';

const translations: Record<Locale, typeof de> = {
  de,
  en,
  fr: en,
  it: en,
};

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  const setLocale = useCallback((newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const strings = translations[locale];

  return { locale, setLocale, strings };
}
