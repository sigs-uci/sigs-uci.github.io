import test from 'node:test';
import assert from 'node:assert/strict';
import { events, eventTranslations } from '../src/data/index';
import { campusDay, filterEvents, filtersFromQuery, filtersToQuery, formatDate, isPublicEvent,
  featuredEvent, nextEvent, newestEventsFirst, normalizeSearch, registrationAction } from '../src/lib/events';
import { eventFixture, testClock } from './fixtures/events';

test('next event excludes every ineligible lifecycle and publication state', () => {
  const eligible = eventFixture({ id: 'eligible', eventState: 'rescheduled' });
  const others = ['tentative', 'postponed', 'cancelled', 'completed'].map((eventState) =>
    eventFixture({ eventState: eventState as typeof eligible.eventState }));
  others.push(eventFixture({ publication: 'draft' }));
  others.push(eventFixture({ startInstant: '2026-01-01T20:00:00Z' }));
  assert.equal(nextEvent([...others, eligible], testClock)?.id, 'eligible');
  assert.equal(nextEvent(events.filter(event => event.archiveLabel), testClock), undefined);
  assert.equal(nextEvent(events.filter(event => event.archiveLabel), new Date('2014-01-01T00:00:00Z')), undefined);
  assert.equal(nextEvent([eventFixture({ startInstant: null, endInstant: null })], testClock), undefined);
});

test('future sorting compares instants rather than offset strings', () => {
  const early = eventFixture({ id: 'early', startInstant: '2026-12-12T20:00:00-08:00' });
  const late = eventFixture({ id: 'late', startInstant: '2026-12-13T05:00:00Z' });
  assert.equal(nextEvent([late, early], testClock)?.id, 'early');
});

test('event listings sort newest first without inventing partial dates or changing input', () => {
  const day = { value: '2026-12-12', precision: 'day' as const, contextYear: 2026 };
  const early = eventFixture({ id: 'early', date: day, startInstant: '2026-12-12T20:00:00-08:00', endInstant: '2026-12-13T04:30:00Z' });
  const late = eventFixture({ id: 'late', date: day, startInstant: '2026-12-13T05:00:00Z', endInstant: '2026-12-13T05:30:00Z' });
  const dateOnly = eventFixture({ id: 'date-only', date: day, startInstant: null, endInstant: null });
  const partial = eventFixture({ id: 'partial', date: { value: null, precision: 'year_context', contextYear: 2026 }, startInstant: null, endInstant: null });
  const older = eventFixture({ id: 'older', date: { value: '2025-12-31', precision: 'day', contextYear: 2025 }, startInstant: null, endInstant: null });
  const unknown = eventFixture({ id: 'unknown', date: { value: null, precision: 'unknown', contextYear: null }, startInstant: null, endInstant: null });
  const records = Object.freeze([unknown, partial, early, older, dateOnly, late]);
  const expected = ['late', 'early', 'date-only', 'partial', 'older', 'unknown'];
  assert.deepEqual(newestEventsFirst(records).map(event => event.id), expected);
  assert.deepEqual(filterEvents(records).map(event => event.id), expected);
  assert.deepEqual(records.map(event => event.id), ['unknown', 'partial', 'early', 'older', 'date-only', 'late']);
  assert.equal(partial.date.value, null);
  assert.equal(unknown.date.contextYear, null);
});

test('homepage feature follows the next event through its end and then the latest record', () => {
  const earlier = eventFixture({ id: 'earlier', date: { value: '2026-10-20', precision: 'day', contextYear: 2026 },
    startInstant: null, endInstant: null, archiveLabel: 'Archived announcement', registration: 'closed' });
  const next = eventFixture({ id: 'next', date: { value: '2026-11-14', precision: 'day', contextYear: 2026 },
    startInstant: '2026-11-14T17:00:00-08:00', endInstant: '2026-11-14T23:00:00-08:00', archiveLabel: null });
  const later = eventFixture({ id: 'later', archiveLabel: null });
  const records = [earlier, later, next];
  assert.equal(featuredEvent(records, testClock)?.id, 'next');
  assert.equal(featuredEvent(records, new Date('2026-11-14T22:59:59-08:00'))?.id, 'next');
  assert.equal(featuredEvent(records, new Date(next.endInstant!))?.id, 'later');
  assert.equal(featuredEvent([earlier, next], new Date(next.endInstant!))?.id, 'next');
  assert.equal(featuredEvent([earlier], testClock)?.eventState, 'scheduled');
  assert.equal(featuredEvent([earlier], testClock)?.archiveLabel, 'Archived announcement');
});

test('homepage feature excludes drafts and unsupported lifecycle states', () => {
  const recent = eventFixture({ id: 'recent', date: { value: '2026-10-01', precision: 'day', contextYear: 2026 }, startInstant: null, endInstant: null });
  const excluded = ['tentative', 'cancelled', 'postponed'].map(eventState => eventFixture({ eventState: eventState as typeof recent.eventState }));
  excluded.push(eventFixture({ publication: 'draft' }));
  excluded.push(eventFixture({ editorial: { en: 'draft', fa: 'not_translated' } }));
  excluded.push(eventFixture({ startInstant: null, endInstant: null }));
  excluded.push({ ...eventFixture(), synthetic: true } as typeof recent);
  assert.equal(featuredEvent([...excluded, recent], testClock)?.id, 'recent');
  assert.equal(featuredEvent(excluded, testClock), undefined);
});

test('date-only filtering uses the campus day and keeps announcements past', () => {
  assert.equal(campusDay(new Date('2026-10-23T03:00:00Z')), '2026-10-22');
  const historical = events.filter(event => event.archiveLabel);
  assert.equal(filterEvents(historical, { period: 'upcoming' }, testClock).length, 0);
  assert.equal(filterEvents(historical, { period: 'past' }, testClock).length, historical.length);
  assert.equal(filterEvents(events, { year: '2019', category: 'film-poetry' }, testClock)[0]?.id, 'pol-media-film-weekend-2019');
  assert.equal(filterEvents(events, { query: 'no matching event phrase' }, testClock).length, 0);
  assert.equal(filterEvents(events, {}, testClock).length, events.length);
});

test('query state survives a URL round trip and unknown periods reset', () => {
  const filters = { year: '2019', category: 'film-poetry', period: 'past', query: 'poetry night' };
  assert.deepEqual(filtersFromQuery(new URLSearchParams(filtersToQuery(filters))), filters);
  assert.equal(filtersFromQuery(new URLSearchParams('period=invalid&year=no')).period, 'all');
  assert.equal(filtersToQuery({}), '');
});

test('Persian search normalization handles yeh, kaf and half spaces', () => {
  assert.equal(normalizeSearch('كتاب يار'), normalizeSearch('کتاب یار'));
  assert.equal(normalizeSearch('دانش‌جو'), normalizeSearch('دانش جو'));
});

test('event filters find the same records with Western, Persian and Arabic-Indic numerals', () => {
  const localized = events.map(event => {
    const translation = eventTranslations.find(record => record.eventId === event.id)!;
    return { ...event, title: translation.title, summary: translation.summary };
  });
  for (const query of ['2025', '۲۰۲۵', '٢٠٢٥']) assert.deepEqual(filterEvents(localized, { query }).map(event => event.id).sort(), ['networking-2025','yalda-2025']);
  for (const query of ['HG1030', 'HG۱۰۳۰', 'HG١٠٣٠']) assert.deepEqual(filterEvents(localized, { query }).map(event => event.id).sort(), ['super-sohrab-2016','tales-2016']);
  assert.equal(normalizeSearch('۲۰۲۵'), '۲۰۲۵');
});

test('event search combines title words with dates and lifecycle without requiring a phrase',()=>{
  for(const query of ['Nowruz 2020','2020 Nowruz','Nowruz ۲۰۲۰','2020 cancelled'])assert.deepEqual(filterEvents(events,{query},testClock).map(event=>event.id),['nowruz-2020']);
  const localized=events.map(event=>{
    const translation=eventTranslations.find(record=>record.eventId===event.id)!;
    return {...event,title:translation.title,summary:translation.summary,searchText:`${event.title} ${event.summary} ${translation.title} ${translation.summary}`};
  });
  assert.deepEqual(filterEvents(localized,{query:'نوروز ٢٠٢٠'},testClock).map(event=>event.id),['nowruz-2020']);
  assert.deepEqual(filterEvents(localized,{query:'Nowruz 2020'},testClock).map(event=>event.id),['nowruz-2020']);
  const english=events.map(event=>({...event,searchText:eventTranslations.find(record=>record.eventId===event.id)?.title}));
  assert.deepEqual(filterEvents(english,{query:'نوروز 2020'},testClock).map(event=>event.id),['nowruz-2020']);
  assert.deepEqual(filterEvents(events,{query:'Nowruz nonexistentword'},testClock),[]);
});

test('date labels retain the Gregorian calendar and date-only day', () => {
  const historical = events.find((event) => event.id === 'nowruz-2019')!;
  assert.equal(formatDate(historical, 'en'), 'March 22, 2019');
  assert.match(formatDate(eventFixture(), 'fa'), /۲۰۲۶/);
  const unknown = eventFixture({ date: { value: null, precision: 'unknown', contextYear: null }, startInstant: null });
  assert.equal(formatDate(unknown), 'Date not recorded');
});

test('registration states expose only valid participation actions', () => {
  for (const registration of ['not_required', 'not_open', 'full', 'closed'] as const) {
    assert.equal(registrationAction(eventFixture({ registration })).href, null);
  }
  assert.equal(registrationAction(eventFixture({ registration: 'open', registrationUrl: 'https://example.com/rsvp' })).href, 'https://example.com/rsvp');
  assert.equal(registrationAction(eventFixture({ registration: 'waitlist', registrationUrl: 'https://example.com/waitlist' })).href, 'https://example.com/waitlist');
  assert.equal(registrationAction(eventFixture({ registration: 'open', registrationUrl: null })).href, 'mailto:sigs@uci.edu');
  assert.equal(registrationAction(eventFixture({ eventState: 'cancelled', registration: 'open', registrationUrl: 'https://example.com/rsvp' })).href, null);
});

test('draft and explicitly synthetic records are excluded', () => {
  assert.equal(isPublicEvent(eventFixture({ publication: 'draft' })), false);
  assert.equal(isPublicEvent(eventFixture({ editorial: { en: 'draft', fa: 'not_translated' } })), false);
  assert.equal(isPublicEvent({ ...eventFixture(), synthetic: true } as ReturnType<typeof eventFixture>), false);
});
