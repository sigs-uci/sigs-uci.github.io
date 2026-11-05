import { canonicalMediaTarget, type MediaRedirectBrowser, type MediaRedirectLocation, type RedirectCollection, type RedirectMedia } from './media-redirects';

const previousHomeMoments = [
  'nowruz-2017-photo-017', 'yalda-2018-kamyar-performance', 'yalda-2019-photo-001', 'mehmooni-2018-photo-001',
  'welcome-2023-photo-002', 'beach-volleyball-2018-recap', 'boat-outing-image-071', 'halloween-2018-photo-019',
  'yalda-2018-photo-015', 'nowruz-2019-photo-016', 'nowruz-2019-k-von-invitation', 'nowruz-2019-dance-rehearsal',
  'community-meals-video-093', 'bonfire-fall-2017-photo-007', 'football-gathering-recap', 'iftar-2017-photo-003',
  'taco-tuesday-2018-recap', 'welcome-2018-community', 'yalda-2019-sandy-invitation', 'yalda-2016-photo-011',
  'community-meals-video-091', 'poetry-night-2019-photo', 'beach-gatherings-video-050', 'nowruz-2019-photo-010',
  'beach-gatherings-image-083', 'community-meals-image-110', 'community-meals-video-092', 'costume-and-karaoke-image-087',
  'watching-football-image-119', 'innovation-forum-2018-community', 'yalda-2018-kamyar-invitation', 'beach-gatherings-video-051',
  'group-portraits-image-118', 'community-meals-video-094', 'beach-gatherings-video-052', 'indoor-community-gathering-image-073',
] as const;

export interface HomeMediaRedirect {
  hash: string;
  href: string;
  mediaId: string;
}

export function buildHomeMediaRedirects(current: readonly string[], collections: readonly RedirectCollection[],
  records: readonly RedirectMedia[], locale: 'en' | 'fa', pageSize = 36): HomeMediaRedirect[] {
  const redirects: HomeMediaRedirect[] = [];
  for (const id of previousHomeMoments) {
    if (current.includes(id)) continue;
    const target = canonicalMediaTarget(id, collections, records, locale, pageSize);
    if (!target) continue;
    const href = target.path + target.hash;
    redirects.push({ hash: `#home-moment-${id}`, href, mediaId: id });
    if (records.find(record => record.id === id)?.kind === 'video') {
      redirects.push({ hash: `#${id}`, href, mediaId: id },
        { hash: `#${id}-caption`, href: `${href}-caption`, mediaId: id });
    }
  }
  return redirects;
}

const homePath = /^\/(en|fa)\/(?:index\.html)?$/;
const albumPath = /^\/(en|fa)\/community\/memories\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:page\/([1-9]\d*)\/)?$/;
const safeHash = /^#[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function homeMediaRedirectDestination(location: MediaRedirectLocation, redirects: unknown): string | undefined {
  const current = location.pathname.match(homePath);
  if (!current || !redirects || typeof redirects !== 'object' || Array.isArray(redirects)) return;
  let hash: string;
  try { hash = decodeURIComponent(location.hash); }
  catch { return; }
  if (!safeHash.test(hash) || !Object.hasOwn(redirects, hash)) return;
  const target = (redirects as Record<string, unknown>)[hash];
  if (typeof target !== 'string' || !target.startsWith('/')) return;
  try {
    const origin = new URL(location.origin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== location.origin) return;
    const destination = new URL(target, origin);
    const album = destination.pathname.match(albumPath);
    if (destination.origin !== origin.origin || destination.search || destination.username || destination.password
      || !album || album[1] !== current[1] || (album[2] && Number(album[2]) < 2)
      || !safeHash.test(destination.hash) || destination.pathname + destination.hash !== target) return;
    if (hash.startsWith('#home-moment-')) {
      const id = hash.slice('#home-moment-'.length);
      if (destination.hash !== `#image-${id}` && destination.hash !== `#${id}`) return;
    } else if (destination.hash !== hash) return;
    return target;
  } catch { return; }
}

export function setupHomeMediaRedirects(redirects: unknown, browser: MediaRedirectBrowser = window): () => void {
  let pending: string | undefined;
  const follow = () => {
    const target = homeMediaRedirectDestination(browser.location, redirects);
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
