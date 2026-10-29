import test from 'node:test';
import assert from 'node:assert/strict';
import { boardTerms, data, events, media, people, programs, organization, validatePublicData } from '../src/data/index';

test('public content passes validation and keeps the historical evidence split', () => {
  assert.deepEqual(validatePublicData(data), []);
  assert.equal(new Set(events.map((event) => event.slug)).size, events.length);
  const originalIds=['yalda-2015','nowruz-2016','tales-2016','yalda-2016','nowruz-2017','iftar-2017','welcome-2017','yalda-2017','nowruz-2018','innovation-forum-2018','yalda-2018','poetry-night-2019','nowruz-2019','yalda-2019','nowruz-2021','yalda-2023','networking-2025','yalda-2025','solidarity-2026-02-02','solidarity-2026-02-10'];
  for(const id of originalIds)assert.ok(events.some(event=>event.id===id),id);
  assert.ok(events.filter((event) => event.archiveLabel === 'Archived announcement').every((event) => ['scheduled','cancelled','postponed','rescheduled'].includes(event.eventState)));
  assert.ok(events.filter(event=>event.eventState==='completed').every(event=>event.archiveLabel==='Documented gathering'));
  assert.equal(programs.length, 6);
});

test('expanded history retains cancellation, partial dates and participation roles',()=>{
  const byId=new Map(events.map(event=>[event.id,event]));
  assert.equal(byId.get('nowruz-2020')?.eventState,'cancelled');
  assert.equal(byId.get('nowruz-2020')?.archiveLabel,'Archived announcement');
  assert.equal(byId.get('bonfire-fall-2017')?.date.value,null);
  assert.equal(byId.get('bonfire-fall-2017')?.date.precision,'year_context');
  assert.equal(byId.get('bonfire-fall-2017')?.date.contextYear,2017);
  assert.equal(byId.get('orientation-2012')?.sigsRole,'participant');
  assert.equal(byId.get('welcome-2023')?.date.value,'2023-09-23');
  assert.equal(byId.get('poetry-night-2019')?.venue,'Palo Verde, UC Irvine');
  assert.equal(byId.get('poetry-night-2019')?.timeDisplay,'8 to 11 PM');
  assert.equal(byId.get('bonfire-2018-10-20')?.eventState,'rescheduled');
  assert.equal(byId.get('bonfire-2018-10-20')?.date.value,'2018-10-20');
  assert.equal(byId.has('bonfire-2018-10-13'),false);
  assert.equal(byId.get('nowruz-2023')?.date.value,'2023-03-20');
  assert.equal(byId.get('nowruz-cruise-2023')?.date.value,'2023-03-27');
  assert.equal(byId.get('nowruz-cruise-2023')?.venue,null);
});

test('archive facts preserve dates, unknown rooms and closed registration', () => {
  const byId = Object.fromEntries(events.map((event) => [event.id, event]));
  assert.equal(byId['nowruz-2017'].venue, 'UCI Student Center');
  assert.equal(byId['nowruz-2018'].timeDisplay, '6:30 to 11 PM in the archived listing; 7:30 to 11:55 PM on the poster');
  assert.equal(byId['nowruz-2018'].startInstant, null);
  assert.equal(byId['nowruz-2018'].endInstant, null);
  assert.equal(byId['nowruz-2021'].startInstant, null);
  assert.equal(byId['yalda-2023'].date.value, '2023-12-16');
  assert.notEqual(byId['solidarity-2026-02-02'].id, byId['solidarity-2026-02-10'].id);
  const approved = new Map([
    ['poetry-night-2019', 'poetry-night-2019-photo'],
    ['tales-2016', 'tales-2016-poster'],
    ['yalda-2025', 'yalda-2025-flyer'],
  ]);
  for (const [eventId, imageId] of approved) assert.ok(media.some(image => image.id === imageId && image.eventId === eventId && image.publication === 'published' && image.rights === 'approved'));
  for (const event of events) {
    assert.equal(event.registration, 'closed');
    assert.equal(event.registrationUrl, null);
    assert.equal(event.startInstant, null);
    assert.equal(event.endInstant, null);
    const imageId = approved.get(event.id);
    if (imageId) assert.ok(event.gallery.includes(imageId));
    for (const id of [...event.gallery, ...(event.heroImage ? [event.heroImage] : [])]) assert.ok(media.some(image => image.id === id && image.eventId === event.id && image.publication === 'published' && image.rights === 'approved'));
    if (imageId) {
      const image = media.find(item => item.id === imageId)!;
      assert.equal(image.eventId, event.id);
      assert.equal(image.publication, 'published');
      assert.equal(image.rights, 'approved');
    }
    assert.equal(event.generateCalendarDownload, false);
    assert.equal(event.generateEventStructuredData, false);
    assert.equal(event.editorial.fa, 'reviewed');
  }
});

test('team terms preserve assignments, order and separate contacts', () => {
  const current = boardTerms.find((term) => term.id === '2026-2027')!;
  const previous = boardTerms.find((term) => term.id === '2025-2026')!;
  assert.equal(current.people.length, 8);
  assert.equal(previous.people.length, 10);
  assert.equal(people.length, 13);
  assert.equal(new Set(boardTerms.flatMap((term) => term.people.map((member) => member.personId))).size, 13);
  for (const term of boardTerms) {
    assert.deepEqual(term.people.map((person) => person.displayOrder), term.people.map((_, index) => index + 1));
    assert.ok(term.people.every((person) => person.termId === term.id));
  }
  assert.equal(current.people[0].telegramUrl, 'https://t.me/KMirso');
  assert.equal(previous.people[0].telegramUrl, 'http://t.me/KMirsohi');
  assert.equal(organization.currentBoardTermId, current.id);
  assert.deepEqual(organization.currentBoard, current.people);
  assert.equal(organization.telegramInvite, null);
  assert.deepEqual(organization.currentSponsors, []);
});

test('content validation rejects duplicate event URLs and broken term references', () => {
  const copy = structuredClone(data);
  copy.events.push(structuredClone(copy.events[0]));
  assert.ok(validatePublicData(copy).length > 0);
  const broken = structuredClone(data);
  broken.boardTerms[0].people[0].personId = 'missing-person';
  assert.ok(validatePublicData(broken).length > 0);
});
