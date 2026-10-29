import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../src/data/index';
import { calendarDownload, escapeCalendarText, foldCalendarLine } from '../src/lib/calendar';
import { eventFixture } from './fixtures/events';

test('historical days never become invented calendar occurrences', () => {
  for (const event of events.filter(record => record.archiveLabel)) assert.equal(calendarDownload(event), null);
  assert.equal(calendarDownload(eventFixture({ publication: 'draft' })), null);
  assert.equal(calendarDownload(eventFixture({ startInstant: null })), null);
  assert.equal(calendarDownload(eventFixture({ endInstant: '2026-12-13T01:00:00Z' })), null);
  assert.equal(calendarDownload(eventFixture({ startInstant: '2026-12-12T19:00:00' })), null);
  assert.equal(calendarDownload(eventFixture({ startInstant: '2027-02-30T19:00:00Z', endInstant: '2027-03-03T20:00:00Z' })), null);
});

test('calendar output uses UTC instants across spring DST and midnight', () => {
  const spring = calendarDownload(eventFixture({ startInstant: '2027-03-14T01:30:00-08:00', endInstant: '2027-03-14T03:30:00-07:00' }))!;
  assert.match(spring, /DTSTART:20270314T093000Z/);
  assert.match(spring, /DTEND:20270314T103000Z/);
  const midnight = calendarDownload(eventFixture({ startInstant: '2026-12-12T23:30:00-08:00', endInstant: '2026-12-13T00:30:00-08:00' }))!;
  assert.match(midnight, /DTSTART:20261213T073000Z/);
  assert.match(midnight, /DTEND:20261213T083000Z/);
});

test('fall DST offsets retain two distinct instants', () => {
  const download = calendarDownload(eventFixture({ startInstant: '2026-11-01T01:30:00-07:00', endInstant: '2026-11-01T01:30:00-08:00' }))!;
  assert.match(download, /DTSTART:20261101T083000Z/);
  assert.match(download, /DTEND:20261101T093000Z/);
});

test('all-day DTEND is exclusive and malformed days are refused', () => {
  const download = calendarDownload(eventFixture({ startInstant: null, endInstant: null, allDay: { start: '2026-12-12', end: '2026-12-13' } }))!;
  assert.match(download, /DTSTART;VALUE=DATE:20261212/);
  assert.match(download, /DTEND;VALUE=DATE:20261213/);
  assert.equal(calendarDownload(eventFixture({ allDay: { start: '2026-02-30', end: '2026-03-02' } })), null);
});

test('UID stays stable while updates and lifecycle map to valid calendar values', () => {
  const before = calendarDownload(eventFixture())!;
  const after = calendarDownload(eventFixture({ eventState: 'cancelled', calendarSequence: 1 }))!;
  assert.equal(before.match(/UID:[^\r]+/)?.[0], after.match(/UID:[^\r]+/)?.[0]);
  assert.match(after, /STATUS:CANCELLED/);
  assert.match(after, /SEQUENCE:1/);
  assert.match(calendarDownload(eventFixture({ eventState: 'tentative' }))!, /STATUS:TENTATIVE/);
  assert.match(calendarDownload(eventFixture({ eventState: 'rescheduled', registration: 'full' }))!, /STATUS:CONFIRMED/);
});

test('calendar escaping and folding preserve UTF-8 text', () => {
  assert.equal(escapeCalendarText('A, B; C\\D\nE'), 'A\\, B\\; C\\\\D\\nE');
  const line = 'SUMMARY:' + 'گفتگو کنار هم '.repeat(15);
  const folded = foldCalendarLine(line);
  for (const piece of folded.split('\r\n')) assert.ok(Buffer.byteLength(piece, 'utf8') <= 75);
  assert.equal(folded.replace(/\r\n /g, ''), line);
  assert.ok(calendarDownload(eventFixture())!.endsWith('\r\n'));
});
