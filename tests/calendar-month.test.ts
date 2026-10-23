import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarMonth, normalizeCalendarMonth, shiftCalendarMonth } from '../src/lib/calendar-month';

test('malformed and short-year calendar URLs fall back to the actual campus month', () => {
  const fallback = '2026-10';
  for (const value of [null, '', '0000-01', '0026-10', '0099-12', '2026-00', '2026-13', '2026-1', '+010000-01', '۱۴۰۵-۰۸']) assert.equal(normalizeCalendarMonth(value, fallback), fallback);
  assert.equal(normalizeCalendarMonth('2019-02', fallback), '2019-02');
});

test('month navigation crosses years and clamps before dates can leave the supported range', () => {
  assert.equal(shiftCalendarMonth('2026-12', 1), '2027-01');
  assert.equal(shiftCalendarMonth('2026-01', -1), '2025-12');
  assert.equal(shiftCalendarMonth('9999-12', 1), '9999-12');
  assert.equal(shiftCalendarMonth('1000-01', -1), '1000-01');
  assert.equal(shiftCalendarMonth('9999-12', -1), '9999-11');
  assert.throws(() => shiftCalendarMonth('0026-01', 1), RangeError);
});

test('Gregorian month grids retain weekdays and century leap-year rules at navigation limits', () => {
  assert.deepEqual(calendarMonth('2026-10'), { year: 2026, month: 10, firstWeekday: 4, days: 31 });
  assert.equal(calendarMonth('2000-02').days, 29);
  assert.equal(calendarMonth('1900-02').days, 28);
  assert.equal(calendarMonth('9999-12').days, 31);
  assert.equal(calendarMonth('1000-01').year, 1000);
});
