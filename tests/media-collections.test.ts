import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../src/data';
import { isPublicEvent } from '../src/lib/events';
import { availableLocales } from '../src/lib/publication';
import { collectionItems, collectionPath, mediaCollections, publicMedia, validateMediaCollections } from '../src/lib/media';
import { pages } from '../src/lib/routes';

test('every public media item belongs to one collection with a safe unique route', () => {
  const paths = new Set(pages.map(page => page.path));
  const ids = mediaCollections.map(collection => collection.id);
  assert.equal(new Set(ids).size, ids.length);
  const assignments = new Map<string, number>();
  for (const collection of mediaCollections) {
    assert.match(collection.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(paths.has(collectionPath(collection)), collection.id);
    assert.deepEqual(availableLocales(collectionPath(collection)), ['en', 'fa']);
    assert.ok(collection.mediaIds.length > 0, collection.id);
    assert.equal(new Set(collection.mediaIds).size, collection.mediaIds.length, collection.id);
    assert.equal(collectionItems(collection).length, collection.mediaIds.length, `${collection.id}: each reference must resolve to approved public media`);
    for (const id of collection.mediaIds) {
      assert.ok(publicMedia.some(item => item.id === id), id);
      assignments.set(id, (assignments.get(id) ?? 0) + 1);
    }
  }
  assert.ok(publicMedia.length > 0);
  for (const item of publicMedia) assert.equal(assignments.get(item.id), 1, `${item.id}: public media must be discoverable exactly once`);
});

test('collection covers, bilingual descriptions and event links belong to their public records', () => {
  const allowed = new Set(['id', 'title', 'description', 'note', 'coverId', 'mediaIds', 'eventIds']);
  for (const collection of mediaCollections) {
    assert.ok(Object.keys(collection).every(field => allowed.has(field)), collection.id);
    assert.ok(collection.mediaIds.includes(collection.coverId), `${collection.id}: cover must belong to the collection`);
    const cover = publicMedia.find(item => item.id === collection.coverId)!;
    assert.ok(cover, collection.id);
    if (cover.kind === 'video') assert.ok(cover.videoPoster, collection.id);
    for (const field of [collection.title, collection.description, collection.note]) {
      assert.deepEqual(Object.keys(field).sort(), ['en', 'fa']);
      assert.ok(field.en.trim(), collection.id);
      assert.match(field.fa, /[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/u, collection.id);
    }
    assert.equal(new Set(collection.eventIds).size, collection.eventIds.length, collection.id);
    for (const id of collection.eventIds) assert.ok(events.some(event => event.id === id && isPublicEvent(event)), `${collection.id}: ${id}`);
  }
});

test('collection publication rejects orphaned assets, broken covers, missing translations and withdrawn permission', () => {
  assert.deepEqual(validateMediaCollections(), []);
  const orphaned = structuredClone(mediaCollections);
  const item = orphaned[0].mediaIds.find(id => id !== orphaned[0].coverId)!;
  orphaned[0].mediaIds = orphaned[0].mediaIds.filter(id => id !== item);
  assert.ok(validateMediaCollections(orphaned).some(error => error.startsWith(`media.${item}:`)));
  const wrongCover = structuredClone(mediaCollections);
  wrongCover[0].coverId = wrongCover[1].coverId;
  assert.ok(validateMediaCollections(wrongCover).some(error => error.includes('Cover must belong')));
  const untranslated = structuredClone(mediaCollections);
  untranslated[0].description.fa = '';
  assert.ok(validateMediaCollections(untranslated).some(error => error.includes('both languages')));
  const withdrawn = structuredClone(publicMedia);
  withdrawn.find(record => record.id === mediaCollections[0].coverId)!.rights = 'pending';
  assert.ok(validateMediaCollections(mediaCollections, withdrawn).some(error => error.includes('published with permission')));
  const brokenEvent = structuredClone(mediaCollections);
  brokenEvent[0].eventIds.push('missing-event');
  assert.ok(validateMediaCollections(brokenEvent).some(error => error.includes('Event link')));
  const duplicate = structuredClone(mediaCollections);
  duplicate[0].mediaIds.push(duplicate[0].mediaIds[0]);
  assert.ok(validateMediaCollections(duplicate).some(error => error.includes('distinct media')));
});
