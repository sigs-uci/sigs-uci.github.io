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
