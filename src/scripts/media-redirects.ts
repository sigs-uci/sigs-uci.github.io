export interface MediaRedirectAlias {
  fromCollectionId: string;
  fromPage: number;
  mediaId: string;
}

export interface RedirectMedia {
  id: string;
  kind?: string;
  publication: string;
  rights: string;
}

export interface RedirectCollection {
  id: string;
  mediaIds: readonly string[];
}

interface SourcePage {
  collectionId: string;
  page: number;
  locale: 'en' | 'fa';
}

export interface MediaRedirectLocation {
  origin: string;
  pathname: string;
  hash: string;
}

export interface MediaRedirectBrowser {
  location: MediaRedirectLocation & { replace: (url: string) => void };
  addEventListener: (type: 'hashchange' | 'pageshow', listener: () => void) => void;
  removeEventListener: (type: 'hashchange' | 'pageshow', listener: () => void) => void;
}

const safeId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const albumPath = /^\/(en|fa)\/community\/memories\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:page\/([1-9]\d*)\/)?$/;
const mediaHash = /^#(?:image-)?[a-z0-9]+(?:-[a-z0-9]+)*$/;
const positiveInteger = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0;

function validAlias(value: unknown): value is MediaRedirectAlias {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const alias = value as Partial<MediaRedirectAlias>;
  return Object.keys(value).length === 3
    && ['fromCollectionId', 'fromPage', 'mediaId'].every(key => Object.hasOwn(value, key))
    && typeof alias.fromCollectionId === 'string' && safeId.test(alias.fromCollectionId)
    && positiveInteger(alias.fromPage)
    && typeof alias.mediaId === 'string' && safeId.test(alias.mediaId);
}

function collectionPage(collectionId: string, page: number, locale: 'en' | 'fa'): string {
  return `/${locale}/community/memories/${collectionId}/${page > 1 ? `page/${page}/` : ''}`;
}

function publicRecords(records: readonly RedirectMedia[]): Map<string, RedirectMedia> {
  return new Map(records.filter(record => record.publication === 'published' && record.rights === 'approved'
    && safeId.test(record.id)).map(record => [record.id, record]));
}

function targetForMedia(mediaId: string, collections: readonly RedirectCollection[], visible: ReadonlyMap<string, RedirectMedia>,
  locale: 'en' | 'fa', pageSize: number): { path: string; hash: string } | undefined {
  const item = visible.get(mediaId);
  if (!item) return;
  const destinations = collections.filter(collection => safeId.test(collection.id) && collection.mediaIds.includes(item.id));
  if (destinations.length !== 1) return;
  const destination = destinations[0];
  const photos = destination.mediaIds.filter(id => visible.has(id) && visible.get(id)!.kind !== 'video');
  const page = item.kind === 'video' ? 1 : Math.floor(photos.indexOf(item.id) / pageSize) + 1;
  if (!positiveInteger(page)) return;
  return { path: collectionPage(destination.id, page, locale), hash: `#${item.kind === 'video' ? '' : 'image-'}${item.id}` };
}

export function canonicalMediaTarget(mediaId: string, collections: readonly RedirectCollection[], records: readonly RedirectMedia[],
  locale: 'en' | 'fa', pageSize = 36): { path: string; hash: string } | undefined {
  if (!safeId.test(mediaId) || !['en', 'fa'].includes(locale) || !positiveInteger(pageSize)) return;
  return targetForMedia(mediaId, collections, publicRecords(records), locale, pageSize);
}

export function videoTargetForHash(hash: string, ids: readonly string[]): { id: string; part: 'video' | 'caption' } | undefined {
  let fragment: string;
  try { fragment = decodeURIComponent(hash); }
  catch { return; }
  for (const id of ids) {
    if (!safeId.test(id)) continue;
    if (fragment === `#${id}`) return { id, part: 'video' };
    if (fragment === `#${id}-caption`) return { id, part: 'caption' };
  }
}

export function legacyMediaPageCount(aliases: unknown, collectionId: string): number {
  if (!Array.isArray(aliases) || !safeId.test(collectionId)) return 1;
  return aliases.reduce((maximum, alias) => validAlias(alias) && alias.fromCollectionId === collectionId
    ? Math.max(maximum, alias.fromPage) : maximum, 1);
}

export function validateMediaRedirectAliases(aliases: unknown, collections: readonly RedirectCollection[],
  records: readonly RedirectMedia[]): string[] {
  if (!Array.isArray(aliases)) return ['mediaRedirects: Needs an array'];
  const errors: string[] = [];
  const seen = new Set<string>();
  const visible = new Map(records.filter(record => record.publication === 'published' && record.rights === 'approved')
    .map(record => [record.id, record]));
  for (const [index, alias] of aliases.entries()) {
    const key = `mediaRedirects.${index}`;
    if (!validAlias(alias)) { errors.push(`${key}: Needs a safe collection ID, media ID and positive page`); continue; }
    if (!collections.some(collection => collection.id === alias.fromCollectionId)) errors.push(`${key}: Source album must remain available`);
    const item = visible.get(alias.mediaId);
    if (!item) { errors.push(`${key}: Target media must be published with permission`); continue; }
    const destinations = collections.filter(collection => safeId.test(collection.id) && collection.mediaIds.includes(item.id));
    if (destinations.length !== 1) errors.push(`${key}: Target media needs one current public album`);
    const from = `${alias.fromCollectionId}/${alias.fromPage}/#${item.kind === 'video' ? '' : 'image-'}${item.id}`;
    if (seen.has(from)) errors.push(`${key}: Source page and hash must be unique`);
    seen.add(from);
  }
  return errors;
}

export function buildMediaRedirectMap(aliases: unknown, collections: readonly RedirectCollection[],
  records: readonly RedirectMedia[], source: SourcePage, pageSize = 36): Record<string, string> {
  const redirects: Record<string, string> = {};
  if (!Array.isArray(aliases) || !safeId.test(source.collectionId) || !positiveInteger(source.page)
    || !['en', 'fa'].includes(source.locale) || !positiveInteger(pageSize)) return redirects;
  if (!collections.some(collection => collection.id === source.collectionId)) return redirects;
  const visible = publicRecords(records);
  const currentPath = collectionPage(source.collectionId, source.page, source.locale);
  for (const alias of aliases) {
    if (!validAlias(alias) || alias.fromCollectionId !== source.collectionId || alias.fromPage !== source.page) continue;
    const target = targetForMedia(alias.mediaId, collections, visible, source.locale, pageSize);
    if (target && target.path !== currentPath) redirects[target.hash] = target.path + target.hash;
  }
  return redirects;
}

export function mediaRedirectDestination(location: MediaRedirectLocation, redirects: unknown): string | undefined {
  if (!redirects || typeof redirects !== 'object' || Array.isArray(redirects)) return;
  const currentPage = location.pathname.match(albumPath);
  if (!currentPage || (currentPage[2] && Number(currentPage[2]) < 2)) return;
  let hash: string;
  try { hash = decodeURIComponent(location.hash); }
  catch { return; }
  if (!mediaHash.test(hash) || !Object.hasOwn(redirects, hash)) return;
  const target = (redirects as Record<string, unknown>)[hash];
  if (typeof target !== 'string' || !target.startsWith('/')) return;
  try {
    const origin = new URL(location.origin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== location.origin) return;
    const destination = new URL(target, origin);
    const destinationPage = destination.pathname.match(albumPath);
    if (destination.origin !== origin.origin || destination.search || destination.username || destination.password
      || !destinationPage || destinationPage[1] !== currentPage[1]
      || (destinationPage[2] && Number(destinationPage[2]) < 2)
      || destination.hash !== hash || destination.pathname + destination.hash !== target) return;
    if (destination.pathname === location.pathname) return;
    return target;
  } catch { return; }
}

export function setupMediaRedirects(redirects: unknown, browser: MediaRedirectBrowser = window): () => void {
  let pending: string | undefined;
  const follow = () => {
    const target = mediaRedirectDestination(browser.location, redirects);
    if (!target) { pending = undefined; return; }
    const request = browser.location.pathname + browser.location.hash + '\n' + target;
    if (request === pending) return;
    pending = request;
    browser.location.replace(target);
  };
  browser.addEventListener('hashchange', follow);
  browser.addEventListener('pageshow', follow);
  follow();
  return () => {
    browser.removeEventListener('hashchange', follow);
    browser.removeEventListener('pageshow', follow);
  };
}
