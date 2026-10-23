import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveDay, filterEvents, hasEnded, nextEvent, occursInMonth, occursOnDay } from '../src/lib/events';
import { eventFixture } from './fixtures/events';

test('midnight all-day start sorts before a timed event on the same campus day', () => {
  for (const date of ['2027-03-14', '2027-11-07']) {
    const offset = date.endsWith('03-14') ? '-08:00' : '-07:00';
    const allDay = eventFixture({ id: 'all-day', date: { value: date, precision: 'day', contextYear: 2027 },
      startInstant: null, endInstant: null, allDay: { start: date, end: date.slice(0, -2) + String(Number(date.slice(-2)) + 1).padStart(2, '0') } });
    const timed = eventFixture({ id: 'timed', date: allDay.date, startInstant: `${date}T01:00:00${offset}`, endInstant: `${date}T01:30:00${offset}` });
    assert.equal(nextEvent([timed, allDay], new Date('2026-12-01T12:00:00Z'))?.id, 'all-day');
  }
});

test('precise schedules derive their local day without a redundant historical day', () => {
  const event = eventFixture({ date: { value: null, precision: 'unknown', contextYear: null },
    startInstant: '2027-01-01T03:00:00Z', endInstant: '2027-01-01T05:00:00Z' });
  assert.equal(effectiveDay(event), '2026-12-31');
  assert.equal(filterEvents([event], { year: '2026' }, new Date('2026-12-01T00:00:00Z')).length, 1);
  assert.equal(occursInMonth(event, '2026-12'), true);
  assert.equal(occursOnDay(event, '2026-12-31'), true);
});

test('an active event remains current until its actual end', () => {
  const event = eventFixture({ startInstant: '2027-03-15T19:00:00-07:00', endInstant: '2027-03-15T21:00:00-07:00' });
  const during = new Date('2027-03-15T19:05:00-07:00');
  assert.equal(hasEnded(event, during), false);
  assert.equal(filterEvents([event], { period: 'past' }, during).length, 0);
  assert.equal(filterEvents([event], { period: 'upcoming' }, during).length, 1);
  assert.equal(hasEnded(event, new Date(event.endInstant!)), true);
});

test('multi-day calendars include occupied days and omit the exclusive end', () => {
  const event = eventFixture({ startInstant: null, endInstant: null, allDay: { start: '2027-03-31', end: '2027-04-02' } });
  assert.equal(occursInMonth(event, '2027-03'), true);
  assert.equal(occursInMonth(event, '2027-04'), true);
  assert.equal(occursOnDay(event, '2027-04-01'), true);
  assert.equal(occursOnDay(event, '2027-04-02'), false);
  assert.equal(hasEnded(event, new Date('2027-04-01T23:59:00-07:00')), false);
  assert.equal(hasEnded(event, new Date('2027-04-02T00:00:00-07:00')), true);
  const midnightEnd = eventFixture({ startInstant: '2027-03-31T23:00:00-07:00', endInstant: '2027-04-01T00:00:00-07:00' });
  assert.equal(occursInMonth(midnightEnd, '2027-04'), false);
});
