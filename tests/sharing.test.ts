import test from 'node:test';
import assert from 'node:assert/strict';
import { events, media } from '../src/data';
import { eventShareImage } from '../src/lib/metadata';

test('the tournament website link uses its approved localized poster for sharing', () => {
  const event = events.find(record => record.id === 'gol-ya-pooch-2026')!;
  const poster = media.find(record => record.id === event.heroImage)!;
  for (const locale of ['en', 'fa'] as const) {
    assert.deepEqual(eventShareImage(event, locale, media), {
      src: poster.src, alt: poster.alt[locale], width: poster.width, height: poster.height,
    });
  }
});

test('sharing never exposes unpublished events or an unapproved poster', () => {
  const event = events.find(record => record.id === 'gol-ya-pooch-2026')!;
  assert.equal(eventShareImage({ ...event, publication: 'draft' }, 'en', media), undefined);
  const withdrawn = structuredClone(media);
  withdrawn.find(record => record.id === event.heroImage)!.rights = 'pending';
  assert.equal(eventShareImage(event, 'en', withdrawn), undefined);
  assert.equal(eventShareImage({ ...event, heroImage: null }, 'en', media), undefined);
  assert.equal(eventShareImage(undefined, 'en', media), undefined);
});
