import test from 'node:test';
import assert from 'node:assert/strict';
import { events, type EventTranslation, type StoryRecord } from '../src/data';
import { availableLocales, eventLocale, eventTextRevision, isPublicStory, reviewedTranslation } from '../src/lib/publication';
import { eventMetadata, organizationMetadata, serializeMetadata } from '../src/lib/metadata';
import { eventFixture, testClock } from './fixtures/events';
import { filterEvents, nextEvent } from '../src/lib/events';

test('a timed event later on the campus day is found consistently', () => {
  const today = eventFixture({ date: { value: '2026-10-22', precision: 'day', contextYear: 2026 },
    startInstant: '2026-10-23T05:00:00Z', endInstant: '2026-10-23T06:00:00Z' });
  assert.equal(nextEvent([today], testClock)?.id, today.id);
  assert.equal(filterEvents([today], { period: 'upcoming' }, testClock).length, 1);
  assert.equal(filterEvents([today], { period: 'past' }, testClock).length, 0);
});

test('counterparts need review of the current source and an enabled locale', () => {
  const event = events[0];
  const translation: EventTranslation = { eventId: event.id, locale: 'fa', title: 'Test title', summary: 'Test summary', body: [],
    status: 'reviewed', sourceRevision: eventTextRevision(event), reviewedOn: '2026-10-22' };
  assert.equal(eventLocale(event, 'fa', [translation], ['en']), 'en');
  assert.equal(eventLocale(event, 'fa', [translation], ['en', 'fa']), 'fa');
  assert.equal(reviewedTranslation(event.id, [{ ...translation, status: 'draft' }]), undefined);
  assert.equal(reviewedTranslation(event.id, [translation], [{ ...event, summary: event.summary + ' Correction.' }]), undefined);
  assert.deepEqual(availableLocales(`events/${event.slug}`), ['en', 'fa']);
  assert.deepEqual(availableLocales('missing-page'), []);
  assert.equal(eventLocale(event, 'fa', [], ['en', 'fa']), 'en');
  assert.equal(eventLocale(event, 'fa', [{ ...translation, sourceRevision: 'stale' }], ['en', 'fa']), 'en');
  assert.equal(reviewedTranslation(event.id, [{ ...translation, reviewedOn: null }]), undefined);
  assert.equal(reviewedTranslation(event.id, [{ ...translation, reviewedOn: '2026-02-30' }]), undefined);
  assert.equal(reviewedTranslation(event.id, [{ ...translation, locale: 'en' as EventTranslation['locale'] }]), undefined);
  assert.equal(reviewedTranslation(event.id, [{ ...translation, title: '  ' }]), undefined);
  assert.equal(reviewedTranslation(event.id, [{ ...translation, summary: '' }]), undefined);
  assert.equal(reviewedTranslation(event.id, [{ ...translation, body: ['  '] }]), undefined);
});

test('stories cannot publish into a disabled locale or with draft editorial state', () => {
  const story = { publication: 'published', editorial: 'reviewed', locale: 'fa' } as StoryRecord;
  assert.equal(isPublicStory(story, ['en']), false);
  assert.equal(isPublicStory(story, ['en', 'fa']), true);
  assert.equal(isPublicStory({ ...story, editorial: 'draft' }, ['en', 'fa']), false);
});

test('historical events emit no Event metadata and future metadata reflects cancellation', () => {
  for (const event of events) assert.equal(eventMetadata(event), null);
  const future = eventFixture({ generateEventStructuredData: true, eventState: 'cancelled', registration: 'closed' });
  const metadata = eventMetadata(future)!;
  assert.equal(metadata.eventStatus, 'https://schema.org/EventCancelled');
  assert.equal(metadata.startDate, future.startInstant);
  assert.equal(eventMetadata({ ...future, startInstant: null }), null);
  assert.equal(organizationMetadata.email, 'sigs@uci.edu');
  assert.equal('taxID' in organizationMetadata, false);
});

test('structured data cannot terminate its script element', () => {
  const value = { name: '</script><p>Example</p>' };
  assert.equal(serializeMetadata(value).includes('</script>'), false);
  assert.deepEqual(JSON.parse(serializeMetadata(value)), value);
});
