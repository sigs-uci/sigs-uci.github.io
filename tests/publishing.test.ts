import test from 'node:test';
import assert from 'node:assert/strict';
import { data, validatePublicData } from '../src/data/index';
import { eventFixture } from './fixtures/events';
import { nextEvent } from '../src/lib/events';

test('event addition and cancellation preserve the archive and identity', () => {
  const copy = structuredClone(data);
  const originalIds = copy.events.map((event) => event.id);
  const addition = eventFixture({ archiveLabel: null });
  copy.events.push(addition);
  assert.deepEqual(validatePublicData(copy), []);
  assert.equal(nextEvent(copy.events, new Date('2026-11-01T00:00:00Z'))?.id, addition.id);
  addition.eventState = 'cancelled';
  addition.registration = 'closed';
  addition.calendarSequence = 1;
  assert.deepEqual(validatePublicData(copy), []);
  assert.equal(nextEvent(copy.events, new Date('2026-11-01T00:00:00Z')), undefined);
  assert.deepEqual(copy.events.slice(0, -1).map((event) => event.id), originalIds);
  assert.equal(copy.events.at(-1)?.slug, addition.slug);
});

test('team update synchronizes the organization and preserves previous terms', () => {
  const copy = structuredClone(data);
  const former = structuredClone(copy.boardTerms[1]);
  copy.boardTerms[0].people[3].role = 'Cultural Chair';
  assert.ok(validatePublicData(copy).length > 0);
  copy.organization.currentBoard = structuredClone(copy.boardTerms[0].people);
  assert.deepEqual(validatePublicData(copy), []);
  assert.deepEqual(copy.boardTerms[1], former);
});

test('photo update needs published permission before a public event can reference it', () => {
  const copy = structuredClone(data);
  const event = copy.events[0];
  const previous = structuredClone(event);
  copy.media.push({ id: 'test-photo', src: '/media/test-photo.webp', width: 800, height: 600,
    eventId: event.id, focalPoint: [0.5, 0.5], alt: { en: 'Isolated image fixture' },
    caption: { en: 'A fixture used for the publishing test.' }, credit: 'Test fixture',
    publication: 'draft', rights: 'pending' });
  event.gallery = ['test-photo'];
  assert.ok(validatePublicData(copy).length > 0);
  copy.media[0].rights = 'approved';
  copy.media[0].publication = 'published';
  assert.deepEqual(validatePublicData(copy), []);
  assert.deepEqual({ ...event, gallery: [] }, previous);
});
