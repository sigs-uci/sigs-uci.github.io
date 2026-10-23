import { events, type EventRecord } from '../data';
import { effectiveDay, isPublicEvent } from './events';

export function archiveYears(records: readonly EventRecord[] = events) {
  const grouped = new Map<string, EventRecord[]>();
  for (const event of records.filter(record => isPublicEvent(record) && record.archiveLabel)) {
    const year = effectiveDay(event)?.slice(0, 4) ?? String(event.date.contextYear ?? '');
    if (!/^\d{4}$/.test(year)) continue;
    grouped.set(year, [...(grouped.get(year) ?? []), event]);
  }
  return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([year, records]) => ({
    year, records: records.sort((a, b) => (effectiveDay(b) ?? '').localeCompare(effectiveDay(a) ?? '')),
  }));
}
