import { normalizeSearch } from './events';

export function searchQueryVariants(query: string): string[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return [];
  const ascii = normalized.replace(/[۰-۹٠-٩]/g, digit =>
    String(digit.charCodeAt(0) - (digit >= '۰' && digit <= '۹' ? 0x6f0 : 0x660)));
  return [...new Set([ascii,
    ascii.replace(/[0-9]/g, digit => String.fromCharCode(0x6f0 + Number(digit))),
    ascii.replace(/[0-9]/g, digit => String.fromCharCode(0x660 + Number(digit)))])];
}

export async function searchWithVariants<T extends { url: string }>(query: string,
  lookup: (variant: string) => Promise<readonly T[]>): Promise<T[]> {
  const results = await Promise.all(searchQueryVariants(query).map(lookup));
  const unique = new Map<string, T>();
  for (const result of results.flat()) if (!unique.has(result.url)) unique.set(result.url, result);
  return [...unique.values()];
}

export function createSearchRunner<T>(lookup: (query: string) => Promise<T[]>) {
  let revision = 0;
  return {
    cancel() { revision++; },
    async run(query: string): Promise<T[] | null> {
      const current = ++revision;
      try {
        const results = await lookup(query);
        return current === revision ? results : null;
      } catch (error) {
        if (current !== revision) return null;
        throw error;
      }
    },
  };
}
