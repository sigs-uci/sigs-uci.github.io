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
  assert.equal(byId.get('bonfire-fall-2017')?.date.value,'2017-10-07');
  assert.equal(byId.get('bonfire-fall-2017')?.date.precision,'day');
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
  assert.equal(byId.get('nowruz-cruise-2023')?.venue,'Balboa Pavilion Building, 400 Main St.');
});

test('identified event media retain their dates and separate World Cup gatherings', () => {
  for (const [id, count] of [['nowruz-cruise-2023', 19], ['yalda-2025', 23], ['halloween-2023', 7], ['bonfire-2023-10-06', 8], ['world-cup-iran-egypt-2026', 2], ['world-cup-iran-morocco-2018', 1], ['spring-gathering-2026', 1], ['yalda-2017', 1]] as const) {
    const event = events.find(event => event.id === id)!;
    const photos = media.filter(item => item.eventId === id && item.kind === 'photo');
    assert.equal(photos.length, count);
    assert.ok(photos.every(item => event.gallery.includes(item.id)));
    assert.equal(event.date.precision, 'day');
    assert.equal(event.eventState, 'completed');
    assert.equal(event.occurrenceEvidence, 'occurrence_corroborated');
    assert.equal(event.archiveLabel, 'Documented gathering');
  }
  assert.equal(events.find(event => event.id === 'yalda-2025')?.date.value, '2025-12-21');
  assert.equal(events.find(event => event.id === 'yalda-2025')?.venue, 'Verano Community Center, Multipurpose Room');
  for (const number of ['091', '092', '093', '094']) {
    const video = media.find(item => item.id === `community-meals-video-${number}`)!;
    assert.equal(video.eventId, 'yalda-2025');
    assert.ok(events.find(event => event.id === 'yalda-2025')!.gallery.includes(video.id));
  }
  assert.equal(events.find(event => event.id === 'world-cup-iran-egypt-2026')?.date.value, '2026-06-26');
  assert.equal(events.find(event => event.id === 'world-cup-iran-morocco-2018')?.date.value, '2018-06-15');
  assert.equal(media.find(item => item.id === 'football-gathering-recap')?.eventId, 'world-cup-iran-morocco-2018');
  assert.equal(media.find(item => item.id === 'iran-egypt-2026-poster')?.eventId, 'world-cup-iran-egypt-2026');
  for (const number of ['050', '051', '052']) {
    const id = `beach-gatherings-video-${number}`;
    assert.equal(media.find(item => item.id === id)?.eventId, 'bonfire-2023-10-06');
    assert.ok(events.find(event => event.id === 'bonfire-2023-10-06')!.gallery.includes(id));
  }
  assert.equal(media.find(item => item.id === 'beach-gatherings-image-083')?.eventId, null);
  const spring = events.find(event => event.id === 'spring-gathering-2026')!;
  assert.equal(spring.date.value, '2026-05-31');
  assert.equal(spring.registration, 'closed');
  assert.equal(spring.registrationUrl, null);
  assert.equal(media.find(item => item.id === 'group-portraits-image-118')?.eventId, spring.id);
  assert.equal(media.find(item => item.id === 'spring-gathering-2026-poster')?.eventId, spring.id);
  assert.equal(media.find(item => item.id === 'gatherings-and-dance-image-044')?.eventId, 'yalda-2017');
  assert.equal(events.find(event => event.id === 'yalda-2017')?.date.value, '2017-12-09');
});

test('archive photo associations preserve the occasion rather than a later promotion', () => {
  const byEvent = new Map(events.map(event => [event.id, event]));
  const byMedia = new Map(media.map(item => [item.id, item]));
  for (const [eventId, date, photoIds] of [
    ['yalda-2015', '2015-12-12', ['gatherings-and-dance-image-007']],
    ['yalda-2016', '2016-12-10', ['gatherings-and-dance-image-019', 'gatherings-and-dance-image-020', 'gatherings-and-dance-image-021']],
    ['nowruz-2017', '2017-03-18', ['nowruz-celebrations-image-008']],
    ['nowruz-2018', '2018-03-18', ['gatherings-and-dance-image-035', 'gatherings-and-dance-image-036']],
    ['welcome-2023', '2023-09-23', ['indoor-community-gathering-image-072', 'indoor-community-gathering-image-074']],
  ] as const) {
    const event = byEvent.get(eventId)!;
    assert.equal(event.date.value, date);
    for (const id of photoIds) {
      assert.equal(byMedia.get(id)?.eventId, eventId);
      assert.ok(event.gallery.includes(id));
    }
  }
  const halloween = byEvent.get('halloween-2017')!;
  assert.equal(halloween.date.value, '2017-10-28');
  assert.equal(halloween.eventState, 'completed');
  assert.equal(halloween.archiveLabel, 'Documented gathering');
  assert.equal(media.filter(item => item.eventId === halloween.id && item.kind === 'photo').length, 18);
  assert.equal(byMedia.get('nowruz-celebrations-image-008')?.credit, 'BLUEYE STUDIO (visible watermark).');
  assert.equal(byMedia.get('community-nowruz-table')?.credit, 'Mahshid Fardadi');
});

test('dated invitations and known contexts do not become unsupported completed events', () => {
  const byEvent = new Map(events.map(event => [event.id, event]));
  for (const id of ['solidarity-2022-09-27', 'solidarity-rally-2022-11-30', 'game-night-2022', 'yalda-2022', 'crystal-cove-hike-2024', 'community-support-2020-01-13']) {
    const event = byEvent.get(id)!;
    assert.equal(event.date.precision, 'day');
    assert.equal(event.archiveLabel, 'Archived announcement');
    assert.equal(event.eventState, 'scheduled');
    assert.equal(event.registration, 'closed');
    assert.equal(event.startInstant, null);
  }
  const welcome = byEvent.get('welcome-2019')!;
  assert.equal(welcome.date.value, '2019-09-22');
  assert.equal(welcome.timeDisplay, '11 AM to 3 PM');
  assert.equal(welcome.venue, null);
  assert.equal(welcome.archiveLabel, 'Archived announcement');
  const orientation = byEvent.get('graduate-orientation-2019')!;
  assert.equal(orientation.date.precision, 'year_context');
  assert.equal(orientation.date.contextYear, 2019);
  assert.equal(orientation.date.value, null);
  assert.equal(orientation.venue, 'UC Irvine');
  assert.equal(orientation.sigsRole, 'community_archive');
  for (const id of ['nowruz-celebrations-image-002', 'nowruz-celebrations-image-003', 'posters-and-venues-image-004',
    'posters-and-venues-image-010', 'welcome-2023-newcomer-artwork', 'community-campus-portrait-01',
    'sigs-team-2023-photo-01', 'sigs-team-2023-photo-02', 'yalda-greeting-2024-community']) {
    assert.equal(media.find(item => item.id === id)?.eventId, null, id);
  }
});

test('archive facts preserve dates, unknown rooms and closed registration', () => {
  const byId = Object.fromEntries(events.map((event) => [event.id, event]));
  assert.equal(byId['nowruz-2017'].venue, 'UCI Student Center');
  assert.equal(byId['nowruz-2018'].timeDisplay, '6:30 to 11 PM in the archived listing; 7:30 to 11:55 PM on the poster');
  assert.equal(byId['nowruz-2018'].startInstant, null);
  assert.equal(byId['nowruz-2018'].endInstant, null);
  assert.equal(byId['nowruz-2018'].venue, 'Pacific Ballroom C, UCI Student Center');
  assert.equal(byId['yalda-2017'].venue, 'Pacific Ballroom D, UCI Student Center');
  assert.equal(byId['tea-talks-2021'].venue, 'Online (Zoom)');
  assert.equal(byId['tea-talks-2021'].timeDisplay, '6:30 to 7:30 PM');
  assert.equal(byId['stress-management-2021'].venue, 'Online (Zoom)');
  assert.equal(byId['nowruz-2021'].startInstant, null);
  assert.equal(byId['yalda-2023'].date.value, '2023-12-16');
  assert.notEqual(byId['solidarity-2026-02-02'].id, byId['solidarity-2026-02-10'].id);
  const approved = new Map([
    ['poetry-night-2019', 'poetry-night-2019-photo'],
    ['tales-2016', 'tales-2016-poster'],
    ['yalda-2025', 'yalda-2025-flyer'],
  ]);
  for (const [eventId, imageId] of approved) assert.ok(media.some(image => image.id === imageId && image.eventId === eventId && image.publication === 'published' && image.rights === 'approved'));
  for (const event of events.filter(record => record.archiveLabel !== null)) {
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
