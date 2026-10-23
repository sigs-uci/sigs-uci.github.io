import { events } from '../../src/data/index';
import type { EventRecord } from '../../src/data/schema';

export const testClock = new Date('2026-10-23T03:00:00Z');

export function eventFixture(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    ...structuredClone(events[0]), id: 'test-gathering', slug: 'test-gathering', title: 'Example gathering for tests',
    summary: 'An isolated event fixture.', date: { value: '2026-12-12', precision: 'day', contextYear: 2026 },
    startInstant: '2026-12-13T02:00:00Z', endInstant: '2026-12-13T04:00:00Z',
    eventState: 'scheduled', registration: 'not_required', generateCalendarDownload: true,
    calendarUpdated: '2026-10-22T20:00:00Z', calendarSequence: 0, ...overrides,
  };
}
