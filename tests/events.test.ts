import test from 'node:test';
import assert from 'node:assert/strict';
import { events, eventTranslations } from '../src/data/index';
import { campusDay, filterEvents, filtersFromQuery, filtersToQuery, formatDate, isPublicEvent,
  nextEvent, normalizeSearch, registrationAction } from '../src/lib/events';
import { eventFixture, testClock } from './fixtures/events';

test('next event excludes every ineligible lifecycle and publication state', () => {
  const eligible = eventFixture({ id: 'eligible', eventState: 'rescheduled' });
  const others = ['tentative', 'postponed', 'cancelled', 'completed'].map((eventState) =>
    eventFixture({ eventState: eventState as typeof eligible.eventState }));
  others.push(eventFixture({ publication: 'draft' }));
  others.push(eventFixture({ startInstant: '2026-01-01T20:00:00Z' }));
  assert.equal(nextEvent([...others, eligible], testClock)?.id, 'eligible');
  assert.equal(nextEvent(events, testClock), undefined);
  assert.equal(nextEvent(events, new Date('2014-01-01T00:00:00Z')), undefined);
  assert.equal(nextEvent([eventFixture({ startInstant: null, endInstant: null })], testClock), undefined);
});

test('future sorting compares instants rather than offset strings', () => {
  const early = eventFixture({ id: 'early', startInstant: '2026-12-12T20:00:00-08:00' });
  const late = eventFixture({ id: 'late', startInstant: '2026-12-13T05:00:00Z' });
  assert.equal(nextEvent([late, early], testClock)?.id, 'early');
});

test('date-only filtering uses the campus day and keeps announcements past', () => {
  assert.equal(campusDay(new Date('2026-10-23T03:00:00Z')), '2026-10-22');
  assert.equal(filterEvents(events, { period: 'upcoming' }, testClock).length, 0);
  assert.equal(filterEvents(events, { period: 'past' }, testClock).length, events.length);
  assert.equal(filterEvents(events, { year: '2019', category: 'film-poetry' }, testClock)[0]?.id, 'poetry-night-2019');
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
