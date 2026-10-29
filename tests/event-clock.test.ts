import test from 'node:test';
import assert from 'node:assert/strict';
import { eventRefreshDelay, eventViewState, featuredEvent, publicEventClocks } from '../src/lib/events';
import { eventFixture } from './fixtures/events';

test('browser clock projections contain public scheduling fields alone', () => {
  const published = eventFixture({ id: 'approved-clock', title: 'Public title omitted from the clock data', editorial: { en: 'reviewed', fa: 'reviewed' } });
  const draft = eventFixture({ id: 'draft-clock', publication: 'draft', title: 'Unpublished title' });
  const unedited = eventFixture({ id: 'unedited-clock', editorial: { en: 'draft', fa: 'not_translated' } });
  const synthetic = { ...eventFixture({ id: 'synthetic-clock' }), synthetic: true };
  const projected = publicEventClocks([published, draft, unedited, synthetic]);
  assert.equal(projected.length, 1);
  assert.equal(projected[0].id, published.id);
  assert.deepEqual(Object.keys(projected[0]).sort(), ['allDay', 'archiveLabel', 'date', 'editorial', 'endInstant', 'eventState', 'id', 'publication', 'startInstant', 'timeZone']);
  assert.doesNotMatch(JSON.stringify(projected), /draft-clock|unedited-clock|synthetic-clock|Unpublished title|Public title/);
  projected[0].date.value = '2027-01-01';
  projected[0].editorial.en = 'draft';
  assert.equal(published.date.value, '2026-12-12');
  assert.equal(published.editorial.en, 'reviewed');
});

test('homepage and event participation change at the actual Pacific end instant', () => {
  const event = eventFixture({ id: 'november-event', date: { value: '2026-11-14', precision: 'day', contextYear: 2026 },
    startInstant: '2026-11-14T17:00:00-08:00', endInstant: '2026-11-14T23:00:00-08:00', archiveLabel: null });
  const later = eventFixture({ id: 'december-event', archiveLabel: null });
  const records = publicEventClocks([later, event]);
  const before = new Date('2026-11-15T06:59:59.500Z');
  const end = new Date('2026-11-15T07:00:00Z');
  assert.equal(eventRefreshDelay(records, before), 500);
  assert.equal(eventViewState(event, before).past, false);
  assert.deepEqual(eventViewState(event, end), { past: true, status: 'Past' });
  assert.equal(featuredEvent(records, before)?.id, event.id);
  assert.equal(featuredEvent(records, end)?.id, later.id);
  assert.equal(featuredEvent(publicEventClocks([event]), end)?.id, event.id);
  assert.equal(event.eventState, 'scheduled');
});

test('date-based refresh follows campus midnight through both daylight-saving changes', () => {
  for (const [day, endInstant] of [['2027-03-14', '2027-03-15T07:00:00Z'], ['2027-11-07', '2027-11-08T08:00:00Z']]) {
    const event = eventFixture({ date: { value: day, precision: 'day', contextYear: 2027 },
      startInstant: null, endInstant: null, timeZone: 'America/Los_Angeles' });
    const before = new Date(Date.parse(endInstant) - 100);
    assert.equal(eventRefreshDelay([event], before), 100);
    assert.equal(eventViewState(event, before).past, false);
    assert.equal(eventViewState(event, new Date(endInstant)).past, true);
    const allDay = { ...event, allDay: { start: day, end: endInstant.slice(0, 10) } };
    assert.equal(eventRefreshDelay([allDay], before), 100);
    assert.equal(eventViewState(allDay, new Date(endInstant)).past, true);
  }
});

test('expired announcements retain their evidence and cancellation keeps its status', () => {
  const now = new Date('2027-01-01T12:00:00Z');
  const announcement = eventFixture({ archiveLabel: 'Archived announcement' });
  assert.deepEqual(eventViewState(announcement, now), { past: true, status: 'Archived announcement' });
  assert.equal(eventViewState({ ...announcement, eventState: 'cancelled' }, now).status, 'cancelled');
  assert.equal(announcement.eventState, 'scheduled');
  assert.equal(eventRefreshDelay([], now), 60_000);
});
