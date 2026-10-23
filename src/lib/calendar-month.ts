const monthPattern = /^[1-9]\d{3}-(?:0[1-9]|1[0-2])$/;
const minimumMonth = 1000 * 12;
const maximumMonth = 9999 * 12 + 11;

export function normalizeCalendarMonth(value: string | null | undefined, fallback: string): string {
  if (value && monthPattern.test(value)) return value;
  if (monthPattern.test(fallback)) return fallback;
  throw new RangeError('Calendar fallback must be a Gregorian month from 1000 to 9999');
}

export function shiftCalendarMonth(value: string, delta: number): string {
  if (!monthPattern.test(value) || !Number.isInteger(delta)) throw new RangeError('Calendar month or shift is invalid');
  const [year, month] = value.split('-').map(Number);
  const shifted = Math.max(minimumMonth, Math.min(maximumMonth, year * 12 + month - 1 + delta));
  return `${Math.floor(shifted / 12)}-${String(shifted % 12 + 1).padStart(2, '0')}`;
}

export function calendarMonth(value: string): { year: number; month: number; firstWeekday: number; days: number } {
  if (!monthPattern.test(value)) throw new RangeError('Calendar month is invalid');
  const [year, month] = value.split('-').map(Number);
  return { year, month, firstWeekday: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(), days: new Date(Date.UTC(year, month, 0)).getUTCDate() };
}
