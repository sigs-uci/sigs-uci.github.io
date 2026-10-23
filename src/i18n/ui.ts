import type { Locale } from '../config/site';
import fa from './fa.json';

export const dictionaries: Record<Locale, Record<string, string>> = { en: {}, fa };
export function tr(locale: Locale, text: string): string {
  const translated = dictionaries[locale]?.[text];
  if (locale === 'fa' && translated === undefined && /[A-Za-z]/.test(text) && !/[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/u.test(text)) {
    throw new Error(`Missing Persian interface text: ${text}`);
  }
  const value = translated ?? text;
  return locale === 'fa' ? value.replace(/[۰-۹]+\s*-\s*[۰-۹]+/g, range => `\u2066${range}\u2069`) : value;
}
export const languageName = (locale: Locale) => locale === 'fa' ? 'فارسی' : 'English';
export const formatNumber = (locale: Locale, value: number) => new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { useGrouping: false }).format(value);
export const formatTerm = (locale: Locale, term: string) => term.replace(/\d+/g, value => formatNumber(locale, Number(value)));
export const formatDay = (locale: Locale, day: string) => new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
