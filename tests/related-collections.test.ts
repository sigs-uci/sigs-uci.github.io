import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../src/data';
import { mediaCollections } from '../src/lib/media';
import { relatedCollections } from '../src/lib/related-collections';

const collection = (id: string) => {
  const found = mediaCollections.find(item => item.id === id);
  assert.ok(found, id);
  return found;
};

test('a shared public event ranks ahead of its category and unrelated albums', () => {
  const current = collection('beach-gatherings');
  const exact = collection('bonfire-2023-10-06');
  const sameCategory = collection('bonfire-fall-2017');
  const otherCategory = collection('yalda-2018');
  const candidates = [otherCategory, sameCategory, current, exact];
  const before = structuredClone(candidates);
  assert.deepEqual(relatedCollections(current, candidates, events), [exact, sameCategory, otherCategory]);
  assert.deepEqual(candidates, before);
});

test('unlinked albums retain the existing directory order as their fallback', () => {
  const current = collection('beach-fire-ring-gatherings');
  assert.deepEqual(current.eventIds, []);
  const expected = mediaCollections.filter(item => item.id !== current.id).slice(0, 3);
  assert.deepEqual(relatedCollections(current, mediaCollections, events), expected);
  assert.deepEqual(relatedCollections(current, mediaCollections, events), expected);
});

test('missing or unpublished event records cannot create a recommendation match', () => {
  const current = collection('beach-gatherings');
  const exact = collection('bonfire-2023-10-06');
  const fallback = collection('yalda-2018');
  const candidates = [fallback, exact];
  assert.deepEqual(relatedCollections(current, candidates, []), candidates);
  const unpublished = events.map(event => ({ ...event, publication: 'draft' as const }));
  assert.deepEqual(relatedCollections(current, candidates, unpublished), candidates);
});

test('recommendations remain distinct, exclude the current album and respect their limit', () => {
  for (const current of mediaCollections) {
    const result = relatedCollections(current, mediaCollections, events);
    assert.equal(result.length, 3);
    assert.equal(new Set(result.map(item => item.id)).size, result.length);
    assert.ok(result.every(item => item.id !== current.id && mediaCollections.includes(item)));
  }
  const current = mediaCollections[0];
  assert.equal(relatedCollections(current, mediaCollections, events, 1).length, 1);
  assert.equal(relatedCollections(current, mediaCollections, events, mediaCollections.length).length, mediaCollections.length - 1);
  for (const limit of [0, -1, 1.5, NaN]) assert.deepEqual(relatedCollections(current, mediaCollections, events, limit), []);
});
