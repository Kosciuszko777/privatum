import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en' | 'fr' | 'it';

const translations: Record<Locale, typeof de> = {
  de,
  en,
  fr: en, // scaffolded — will be replaced
  it: en, // scaffolded — will be replaced
};

let currentLocale: Locale = 'de';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[currentLocale];
  for (const k of keys) {
    value = value?.[k];
  }
  if (typeof value === 'string') return value;

  // Fallback to German
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fallback: any = translations.de;
  for (const k of keys) {
    fallback = fallback?.[k];
  }
  return typeof fallback === 'string' ? fallback : key;
}
