import type { Locale } from '../config/site';

export const dictionaries: Partial<Record<Locale, Record<string, string>>> = { en: {} };
export const tr = (locale: Locale, text: string) => dictionaries[locale]?.[text] ?? text;
export const languageName = (locale: Locale) => locale === 'fa' ? 'فارسی' : 'English';
