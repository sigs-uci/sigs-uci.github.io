import { events, type EventRecord } from '../data';
import { effectiveDay, isPublicEvent, newestEventsFirst } from './events';
import type { Locale } from '../config/site';

export function archiveDescription(year: string, count: number, locale: Locale = 'en'): string {
  if (locale === 'en') return `Browse ${count} SIGS event listing${count === 1 ? '' : 's'} from ${year}.`;
  const number = new Intl.NumberFormat('fa-IR', { useGrouping: false });
  return `${number.format(count)} برنامه و دعوت‌نامه از SIGS در سال ${number.format(Number(year))} را ببینید.`;
}

export function archiveYears(records: readonly EventRecord[] = events) {
  const grouped = new Map<string, EventRecord[]>();
  for (const event of records.filter(record => isPublicEvent(record) && record.archiveLabel)) {
    const year = effectiveDay(event)?.slice(0, 4) ?? String(event.date.contextYear ?? '');
    if (!/^\d{4}$/.test(year)) continue;
    grouped.set(year, [...(grouped.get(year) ?? []), event]);
  }
  return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([year, records]) => ({
    year, records: newestEventsFirst(records),
  }));
}
