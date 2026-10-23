import test from 'node:test';
import assert from 'node:assert/strict';
import { boardTerms, data, events, media, people, programs, organization, validatePublicData } from '../src/data/index';

test('public content passes validation and keeps the historical evidence split', () => {
  assert.deepEqual(validatePublicData(data), []);
  assert.equal(events.length, 20);
  assert.equal(new Set(events.map((event) => event.slug)).size, 20);
  assert.equal(events.filter((event) => event.archiveLabel === 'Archived announcement').length, 11);
  assert.equal(events.filter((event) => event.eventState === 'completed').length, 9);
  assert.ok(events.filter((event) => event.archiveLabel === 'Archived announcement').every((event) => event.eventState === 'scheduled'));
  assert.equal(programs.length, 6);
});

test('archive facts preserve dates, unknown rooms and closed registration', () => {
  const byId = Object.fromEntries(events.map((event) => [event.id, event]));
  assert.equal(byId['nowruz-2017'].venue, 'UCI Student Center');
  assert.equal(byId['nowruz-2021'].startInstant, null);
  assert.equal(byId['yalda-2023'].date.value, '2023-12-16');
  assert.notEqual(byId['solidarity-2026-02-02'].id, byId['solidarity-2026-02-10'].id);
  const approved = new Map([
    ['poetry-night-2019', 'poetry-night-2019-photo'],
    ['tales-2016', 'tales-2016-poster'],
    ['yalda-2025', 'yalda-2025-flyer'],
  ]);
  assert.equal(media.length, approved.size);
  for (const event of events) {
    assert.equal(event.registration, 'closed');
    assert.equal(event.registrationUrl, null);
    assert.equal(event.startInstant, null);
    assert.equal(event.endInstant, null);
    const imageId = approved.get(event.id);
    assert.deepEqual(event.gallery, imageId ? [imageId] : []);
    assert.equal(event.heroImage, imageId ?? null);
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
