import type { EventRecord } from '../data/schema';

export interface EventFilters {
  year?: string;
  category?: string;
  period?: string;
  query?: string;
}

export const campusTimeZone = 'America/Los_Angeles';
export type EventSchedule = Pick<EventRecord, 'date' | 'startInstant' | 'allDay'> & Partial<Pick<EventRecord, 'timeZone' | 'endInstant'>>;
export type EventSearchRecord = Pick<EventRecord, 'id' | 'title' | 'summary' | 'venue' | 'category' | 'publication' | 'editorial' | 'eventState'> & EventSchedule;

export function isPublicEvent(event: Pick<EventRecord, 'publication' | 'editorial'> & { synthetic?: boolean }): boolean {
  return event.publication === 'published' && ['edited', 'reviewed'].includes(event.editorial.en)
    && !event.synthetic;
}

export function campusDay(now = new Date()): string {
  return dayInZone(now, campusTimeZone);
}

function dayInZone(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function effectiveDay(event: EventSchedule): string | null {
  if (event.allDay) return event.allDay.start;
  if (event.startInstant) return dayInZone(new Date(event.startInstant), event.timeZone ?? campusTimeZone);
  return event.date.value;
}

function scheduleStart(event: EventSchedule): number {
  if (event.startInstant) return Date.parse(event.startInstant);
  const day = effectiveDay(event);
  if (!day) return Number.NaN;
  const target = Date.parse(`${day}T00:00:00Z`);
  let estimate = target;
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: event.timeZone ?? campusTimeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = formatter.formatToParts(new Date(estimate));
    const value = (name: string) => Number(parts.find(part => part.type === name)?.value);
    const local = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute'), value('second'));
    estimate += target - local;
  }
  return estimate;
}

export function hasEnded(event: EventSchedule, now = new Date()): boolean {
  if (event.endInstant) return Date.parse(event.endInstant) <= now.getTime();
  const today = dayInZone(now, event.timeZone ?? campusTimeZone);
  if (event.allDay) return event.allDay.end <= today;
  const day = effectiveDay(event);
  if (day) return day < today;
  return Boolean(event.date.contextYear && event.date.contextYear < Number(today.slice(0, 4)));
}

function finalDay(event: EventSchedule): string | null {
  if (event.allDay) return new Date(Date.parse(`${event.allDay.end}T00:00:00Z`) - 1).toISOString().slice(0, 10);
  if (event.endInstant) return dayInZone(new Date(Date.parse(event.endInstant) - 1), event.timeZone ?? campusTimeZone);
  return effectiveDay(event);
}

export function occursOnDay(event: EventSchedule, day: string): boolean {
  const start = effectiveDay(event);
  const end = finalDay(event);
  return Boolean(start && end && start <= day && day <= end);
}

export function occursInMonth(event: EventSchedule, month: string): boolean {
  const start = effectiveDay(event);
  const end = finalDay(event);
  return Boolean(start && end && start.slice(0, 7) <= month && month <= end.slice(0, 7));
}

export function isFutureEvent(event: EventSchedule, now = new Date()): boolean {
  if (event.startInstant) return new Date(event.startInstant).getTime() > now.getTime();
  const day = effectiveDay(event);
  return Boolean(day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day > dayInZone(now, event.timeZone ?? campusTimeZone));
}

export function nextEvent(records: readonly EventRecord[], now = new Date()): EventRecord | undefined {
  return records.filter((event) => isPublicEvent(event)
    && ['scheduled', 'rescheduled'].includes(event.eventState)
    && Boolean(event.startInstant || event.allDay)
    && isFutureEvent(event, now))
    .sort((a, b) => scheduleStart(a) - scheduleStart(b))[0];
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u200c\u200d]/g, ' ').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

export function normalizeFilters(input: EventFilters = {}): Required<EventFilters> {
  return {
    year: /^\d{4}$/.test(input.year ?? '') ? input.year! : '',
    category: input.category?.trim() ?? '',
    period: ['past', 'upcoming'].includes(input.period ?? '') ? input.period! : 'all',
    query: input.query?.trim() ?? '',
  };
}

export function filtersFromQuery(query: URLSearchParams): Required<EventFilters> {
  return normalizeFilters({ year: query.get('year') ?? '', category: query.get('category') ?? '',
    period: query.get('period') ?? '', query: query.get('q') ?? '' });
}

export function filtersToQuery(filters: EventFilters): string {
  const selected = normalizeFilters(filters);
  const query = new URLSearchParams();
  for (const key of ['year', 'category', 'period', 'query'] as const) {
    if (selected[key] && selected[key] !== 'all') query.set(key === 'query' ? 'q' : key, selected[key]);
  }
  return query.toString();
}

export function filterEvents<T extends EventSearchRecord>(records: readonly T[], input: EventFilters = {}, now = new Date()): T[] {
  const filters = normalizeFilters(input);
  const query = normalizeSearch(filters.query);
  return records.filter((event) => {
    if (!isPublicEvent(event)) return false;
    if (filters.year && !String(effectiveDay(event) ?? event.date.contextYear ?? '').startsWith(filters.year)) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.period === 'upcoming' && (!event.startInstant && !event.allDay
      || hasEnded(event, now) || !['scheduled', 'rescheduled'].includes(event.eventState))) return false;
    if (filters.period === 'past' && !hasEnded(event, now)) return false;
    return !query || normalizeSearch([event.title, event.summary, event.venue, event.category].filter(Boolean).join(' ')).includes(query);
  });
}

export function formatDate(event: EventRecord, locale = 'en'): string {
  const language = locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US';
  if (event.startInstant) return new Intl.DateTimeFormat(language, {
    timeZone: event.timeZone ?? campusTimeZone, dateStyle: 'long',
  }).format(new Date(event.startInstant));
  const day = effectiveDay(event);
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const formatter = new Intl.DateTimeFormat(language, { timeZone: 'UTC', dateStyle: 'long' });
    const start = formatter.format(new Date(`${day}T12:00:00Z`));
    if (event.allDay) {
      const lastDay = finalDay(event);
      if (lastDay && lastDay !== day) return `${start} - ${formatter.format(new Date(`${lastDay}T12:00:00Z`))}`;
    }
    return start;
  }
  if (event.date.contextYear) return new Intl.NumberFormat(language, { useGrouping: false }).format(event.date.contextYear);
  return locale === 'fa' ? 'تاریخ ثبت نشده' : 'Date not recorded';
}

export function formatTimeRange(event: EventRecord, locale = 'en'): string | null {
  if (event.timeDisplay?.trim()) return event.timeDisplay;
  if (!event.startInstant || event.allDay) return null;
  const language = locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US';
  const timeZone = event.timeZone ?? campusTimeZone;
  const start = new Date(event.startInstant);
  const end = event.endInstant ? new Date(event.endInstant) : null;
  const crossesDay = end && dayInZone(start, timeZone) !== dayInZone(end, timeZone);
  const formatter = new Intl.DateTimeFormat(language, {
    timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    ...(crossesDay ? { month: 'short', day: 'numeric', year: 'numeric' } : {}),
  });
  return end ? `${formatter.format(start)} - ${formatter.format(end)}` : formatter.format(start);
}

export function registrationAction(event: EventRecord): { label: string; href: string | null } {
  if (event.eventState === 'cancelled') return { label: 'Cancelled', href: null };
  if (event.eventState === 'postponed') return { label: 'New date pending', href: null };
  if (event.eventState === 'completed') return { label: 'Past gathering', href: null };
  const states = {
    not_required: 'No RSVP required', not_open: 'RSVP is not open', open: 'RSVP',
    full: 'At capacity', waitlist: 'Join the waitlist', closed: 'Registration closed',
  };
  const actionable = ['open', 'waitlist'].includes(event.registration);
  return { label: actionable && !event.registrationUrl ? 'Contact SIGS about attending' : states[event.registration],
    href: actionable ? event.registrationUrl ?? 'mailto:sigs@uci.edu' : null };
}
