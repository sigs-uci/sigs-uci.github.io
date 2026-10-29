import { events, type EventRecord } from '../data';
import { effectiveDay, isPublicEvent, newestEventsFirst } from './events';
import type { Locale } from '../config/site';

export function archiveDescription(year: string, count: number, locale: Locale = 'en'): string {
  if (locale === 'en') return `Browse ${count} historical event record${count === 1 ? '' : 's'} from ${year}, with dates, descriptions, and the context of each gathering or announcement.`;
  const number = new Intl.NumberFormat('fa-IR', { useGrouping: false });
  return `${number.format(count)} مدخل از برنامه‌های سال ${number.format(Number(year))} را همراه با تاریخ، توضیحات و زمینهٔ هر گردهمایی یا اطلاعیه ببینید.`;
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
