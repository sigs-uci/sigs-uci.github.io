import type { EventRecord } from '../data/schema';
import { isPublicEvent } from './events';

export function escapeCalendarText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\n|\r/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function foldCalendarLine(value: string): string {
  const encoder = new TextEncoder();
  let output = '';
  let line = '';
  for (const character of value) {
    if (encoder.encode(line + character).length > 75) {
      output += line + '\r\n';
      line = ' ';
    }
    line += character;
  }
  return output + line;
}

function instant(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  if (!validDay(value.slice(0, 10)) || Number(value.slice(11, 13)) > 23
    || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19) || 0) > 59) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : null;
}

function validDay(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function calendarDownload(event: EventRecord): string | null {
  if (!isPublicEvent(event) || !event.generateCalendarDownload) return null;
  let start: string;
  let end: string;
  let stamp: string | null;
  if (event.allDay) {
    if (event.startInstant || event.endInstant) return null;
    if (!validDay(event.allDay.start) || !validDay(event.allDay.end) || event.allDay.end <= event.allDay.start) return null;
    start = `DTSTART;VALUE=DATE:${event.allDay.start.replace(/-/g, '')}`;
    end = `DTEND;VALUE=DATE:${event.allDay.end.replace(/-/g, '')}`;
    stamp = instant(event.calendarUpdated ?? `${event.allDay.start}T00:00:00Z`);
  } else {
    if (!event.startInstant || !event.endInstant || new Date(event.endInstant) <= new Date(event.startInstant)) return null;
    const from = instant(event.startInstant);
    const to = instant(event.endInstant);
    if (!from || !to) return null;
    start = `DTSTART:${from}`;
    end = `DTEND:${to}`;
    stamp = instant(event.calendarUpdated ?? event.startInstant);
  }
  if (!stamp) return null;
  const status = event.eventState === 'cancelled' ? 'CANCELLED'
    : ['tentative', 'postponed'].includes(event.eventState) ? 'TENTATIVE' : 'CONFIRMED';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SIGS at UC Irvine//Events//EN',
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${escapeCalendarText(event.id)}@sigs-uci.github.io`,
    `DTSTAMP:${stamp}`, `SEQUENCE:${event.calendarSequence ?? 0}`, start, end,
    `SUMMARY:${escapeCalendarText(event.title)}`, `DESCRIPTION:${escapeCalendarText(event.summary)}`,
    ...(event.venue ? [`LOCATION:${escapeCalendarText(event.venue)}`] : []),
    `URL:https://sigs-uci.github.io/en/events/${encodeURIComponent(event.slug)}/`, `STATUS:${status}`,
    'END:VEVENT', 'END:VCALENDAR'];
  return lines.map(foldCalendarLine).join('\r\n') + '\r\n';
}
