import type { EventRecord } from '../data/schema';

export interface EventFilters {
  year?: string;
  category?: string;
  period?: string;
  query?: string;
}

export const campusTimeZone = 'America/Los_Angeles';
export type EventSchedule = Pick<EventRecord, 'date' | 'startInstant' | 'allDay'>;
export type EventSearchRecord = Pick<EventRecord, 'id' | 'title' | 'summary' | 'venue' | 'category' | 'publication' | 'editorial' | 'eventState'> & EventSchedule;

export function isPublicEvent(event: Pick<EventRecord, 'publication' | 'editorial'> & { synthetic?: boolean }): boolean {
  return event.publication === 'published' && ['edited', 'reviewed'].includes(event.editorial.en)
    && !event.synthetic;
}

export function campusDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: campusTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

function eventDay(event: EventSchedule): string | null {
  return event.allDay?.start ?? event.date.value;
}

export function isFutureEvent(event: EventSchedule, now = new Date()): boolean {
  if (event.startInstant) return new Date(event.startInstant).getTime() > now.getTime();
  const day = eventDay(event);
  return Boolean(day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day > campusDay(now));
}

export function nextEvent(records: readonly EventRecord[], now = new Date()): EventRecord | undefined {
  return records.filter((event) => isPublicEvent(event)
    && ['scheduled', 'rescheduled'].includes(event.eventState)
    && Boolean(event.startInstant || event.allDay)
    && isFutureEvent(event, now))
    .sort((a, b) => Date.parse(a.startInstant ?? `${eventDay(a)}T12:00:00Z`)
      - Date.parse(b.startInstant ?? `${eventDay(b)}T12:00:00Z`))[0];
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
    if (filters.year && !String(eventDay(event) ?? event.date.contextYear ?? '').startsWith(filters.year)) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.period === 'upcoming' && (!event.startInstant && !event.allDay
      || !isFutureEvent(event, now) || !['scheduled', 'rescheduled'].includes(event.eventState))) return false;
    if (filters.period === 'past' && isFutureEvent(event, now)) return false;
    return !query || normalizeSearch([event.title, event.summary, event.venue, event.category].filter(Boolean).join(' ')).includes(query);
  });
}

export function formatDate(event: EventRecord, locale = 'en'): string {
  const language = locale === 'fa' ? 'fa-IR-u-ca-gregory' : 'en-US';
  if (event.startInstant) return new Intl.DateTimeFormat(language, {
    timeZone: event.timeZone ?? campusTimeZone, dateStyle: 'long',
  }).format(new Date(event.startInstant));
  const day = eventDay(event);
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) return new Intl.DateTimeFormat(language, {
    timeZone: 'UTC', dateStyle: 'long',
  }).format(new Date(`${day}T12:00:00Z`));
  if (event.date.contextYear) return new Intl.NumberFormat(language, { useGrouping: false }).format(event.date.contextYear);
  return 'Date not recorded';
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
