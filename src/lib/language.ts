const eventState = ['period', 'year', 'category', 'q', 'view', 'month'];

export function languageSwitchHref(destination: string, current: URL): string {
  const target = new URL(destination, current);
  const route = (url: URL) => url.pathname.replace(/^\/(?:en|fa)(?=\/)/, '');
  if (target.origin !== current.origin || route(target) !== route(current)) return target.href;
  const keys = /^\/events\/(?:archive\/)?$/.test(route(current)) ? eventState
    : route(current) === '/search/' ? ['q'] : [];
  for (const key of keys) {
    const value = current.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.hash = current.hash;
  return target.href;
}
