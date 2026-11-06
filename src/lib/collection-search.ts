import { normalizeSearch } from './events';

export function collectionSearchText(value: string): string {
  return normalizeSearch(value).replace(/[۰-۹٠-٩]/g, digit =>
    String(digit.charCodeAt(0) - (digit >= '۰' && digit <= '۹' ? 0x6f0 : 0x660)));
}

export function matchesCollection(text: string, query: string): boolean {
  const haystack = collectionSearchText(text);
  return collectionSearchText(query).split(' ').filter(Boolean).every(word => haystack.includes(word));
}
