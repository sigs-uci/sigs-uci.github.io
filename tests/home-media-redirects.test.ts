import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeMediaRedirects, homeMediaRedirectDestination, setupHomeMediaRedirects } from '../src/scripts/home-media-redirects';
import { canonicalMediaTarget, videoTargetForHash, type RedirectMedia } from '../src/scripts/media-redirects';
import { albumAtPath, albumPhotos, collectionItems, mediaCollections, publicMedia } from '../src/lib/media';

const component = readFileSync(new URL('../src/components/HomeMedia.astro', import.meta.url), 'utf8');
const current = [...component.match(/const selected = \[([\s\S]*?)\];/)![1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const photo = 'nowruz-2017-photo-017';
const clip = 'nowruz-2019-dance-rehearsal';
const source = () => ({ origin: 'https://sigs-uci.github.io', pathname: '/en/', hash: `#home-moment-${photo}` });
const destination = `/en/community/memories/nowruz-2017/#image-${photo}`;

test('shared canonical lookup counts approved photographs while videos stay on album page one', () => {
  const records: RedirectMedia[] = [
    { id: clip, kind: 'video', publication: 'published', rights: 'approved' },
    { id: 'draft', kind: 'photo', publication: 'draft', rights: 'approved' },
    ...Array.from({ length: 36 }, (_, index) => ({ id: `photo-${index}`, kind: 'photo', publication: 'published', rights: 'approved' })),
    { id: photo, kind: 'photo', publication: 'published', rights: 'approved' },
  ];
  const collections = [{ id: 'album', mediaIds: records.map(item => item.id) }];
  const redirects = buildHomeMediaRedirects([], collections, records, 'fa');
  assert.equal(redirects.find(item => item.hash === `#home-moment-${photo}`)?.href, `/fa/community/memories/album/page/2/#image-${photo}`);
  assert.equal(redirects.find(item => item.hash === `#${clip}`)?.href, `/fa/community/memories/album/#${clip}`);
  assert.equal(redirects.find(item => item.hash === `#${clip}-caption`)?.href, `/fa/community/memories/album/#${clip}-caption`);
  collections[0].mediaIds = collections[0].mediaIds.filter(id => id !== 'photo-0');
  assert.equal(canonicalMediaTarget(photo, collections, records, 'fa')?.path, '/fa/community/memories/album/');
  records.find(item => item.id === photo)!.rights = 'pending';
  assert.equal(canonicalMediaTarget(photo, collections, records, 'fa'), undefined);
  assert.equal(buildHomeMediaRedirects([], collections, records, 'fa').some(item => item.mediaId === photo), false);
  assert.equal(canonicalMediaTarget(clip, [...collections, { id: 'other', mediaIds: [clip] }], records, 'fa'), undefined);
  assert.equal(canonicalMediaTarget('../clip', collections, records, 'en'), undefined);
  assert.equal(canonicalMediaTarget(clip, collections, records, 'en', 0), undefined);
});

test('all 56 removed homepage fragments resolve to existing media in the same language', () => {
  assert.equal(current.length, 8);
  for (const locale of ['en', 'fa'] as const) {
    const redirects = buildHomeMediaRedirects(current, mediaCollections, publicMedia, locale);
    assert.equal(redirects.length, 56);
    assert.equal(new Set(redirects.map(item => item.hash)).size, 56);
    assert.equal(redirects.filter(item => item.hash.startsWith('#home-moment-')).length, 30);
    assert.equal(redirects.filter(item => item.hash.endsWith('-caption')).length, 13);
    const map = Object.fromEntries(redirects.map(item => [item.hash, item.href]));
    for (const redirect of redirects) {
      assert.equal(current.includes(redirect.mediaId), false);
      const media = publicMedia.find(item => item.id === redirect.mediaId)!;
      assert.ok(media);
      const url = new URL(redirect.href, source().origin);
      const album = albumAtPath(url.pathname.replace(/^\/(en|fa)\//, '').replace(/\/$/, ''))!;
      assert.ok(album, redirect.href);
      if (media.kind === 'video') {
        assert.equal(album.page, 1);
        assert.ok(collectionItems(album.collection).some(item => item.id === media.id));
        assert.deepEqual(videoTargetForHash(url.hash, [media.id]), { id: media.id, part: redirect.hash.endsWith('-caption') ? 'caption' : 'video' });
        assert.ok(media.transcript?.en && media.transcript.fa);
      } else {
        assert.ok(albumPhotos(collectionItems(album.collection), album.page).some(item => item.id === media.id));
        assert.equal(url.hash, `#image-${media.id}`);
      }
      assert.equal(homeMediaRedirectDestination({ ...source(), pathname: `/${locale}/`, hash: redirect.hash }, map), redirect.href);
    }
    for (const id of current) assert.equal(Object.hasOwn(map, `#home-moment-${id}`), false);
  }
});

test('exact known home fragments work on local previews and explicit index URLs', () => {
  const map = { [`#home-moment-${photo}`]: destination };
  assert.equal(homeMediaRedirectDestination(source(), map), destination);
  assert.equal(homeMediaRedirectDestination({ ...source(), origin: 'http://127.0.0.1:4321', pathname: '/en/index.html' }, map), destination);
  assert.equal(homeMediaRedirectDestination({ ...source(), hash: '#home-moment-nowruz-2017-photo-%30%31%37' }, map), destination);
  const caption = `#${clip}-caption`;
  const captionTarget = `/fa/community/memories/nowruz-2019/${caption}`;
  assert.equal(homeMediaRedirectDestination({ ...source(), pathname: '/fa/', hash: caption }, { [caption]: captionTarget }), captionTarget);
  assert.deepEqual(videoTargetForHash(caption, [clip]), { id: clip, part: 'caption' });
  assert.deepEqual(videoTargetForHash(`#${clip}`, [clip]), { id: clip, part: 'video' });
  for (const hash of [`#${clip}-description`, `#${clip}-caption-extra`, '#%E0%A4%A', '#unknown']) {
    assert.equal(videoTargetForHash(hash, [clip]), undefined);
  }
});

test('unrelated hashes, non-home pages and unsafe or mismatched targets do not redirect', () => {
  const key = source().hash;
  const map = { [key]: destination };
  for (const hash of ['', '#community-in-pictures', `#${photo}`, `${key}-extra`, '#%E0%A4%A', '#home-moment-nowruz-2017-photo-%2530%2531%2537']) {
    assert.equal(homeMediaRedirectDestination({ ...source(), hash }, map), undefined);
  }
  for (const target of ['https://example.org' + destination, '//example.org' + destination,
    destination.replace('/en/', '/fa/'), destination.replace('/community/memories/', '/events/'),
    destination.replace('/#', '/?query=1#'), destination.replace('/#', '/page/1/#'),
    destination.replace('/#', '/../other/#'), destination.replace(photo, 'other-photo'), null, 42]) {
    assert.equal(homeMediaRedirectDestination(source(), { [key]: target }), undefined, String(target));
  }
  for (const pathname of ['/en/events/', '/fa/', '/', '/en/community/memories/nowruz-2017/']) {
    assert.equal(homeMediaRedirectDestination({ ...source(), pathname }, map), undefined);
  }
  assert.equal(homeMediaRedirectDestination({ ...source(), origin: 'null' }, map), undefined);
  assert.equal(homeMediaRedirectDestination(source(), Object.create(map)), undefined);
  assert.equal(homeMediaRedirectDestination(source(), []), undefined);
});

test('initial, history and pageshow redirects replace once and release their listeners', () => {
  const listeners = new Map<string, Set<() => void>>();
  const replaced: string[] = [];
  const browser = {
    location: { ...source(), replace: (url: string) => replaced.push(url) },
    addEventListener: (type: string, listener: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: () => void) => listeners.get(type)?.delete(listener),
  };
  const dispatch = (type: string) => listeners.get(type)?.forEach(listener => listener());
  const cleanup = setupHomeMediaRedirects({ [source().hash]: destination }, browser);
  assert.deepEqual(replaced, [destination]);
  dispatch('hashchange'); dispatch('pageshow');
  assert.deepEqual(replaced, [destination]);
  browser.location.hash = '#community-in-pictures'; dispatch('hashchange');
  browser.location.hash = source().hash; dispatch('pageshow');
  assert.deepEqual(replaced, [destination, destination]);
  cleanup(); dispatch('pageshow');
  assert.equal(replaced.length, 2);
});
