import type { Locale } from '../config/site';
import fa from './fa.json';

export const dictionaries: Record<Locale, Record<string, string>> = { en: {}, fa };
export function tr(locale: Locale, text: string): string {
  const translated = dictionaries[locale]?.[text] ?? text;
  return locale === 'fa' ? translated.replace(/[۰-۹]+\s*-\s*[۰-۹]+/g, range => `\u2066${range}\u2069`) : translated;
}
export const languageName = (locale: Locale) => locale === 'fa' ? 'فارسی' : 'English';
export const formatNumber = (locale: Locale, value: number) => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }).format(value);
export const formatTerm = (locale: Locale, term: string) => term.replace(/\d+/g, value => formatNumber(locale, Number(value)));
export const formatDay = (locale: Locale, day: string) => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
