import test from 'node:test';
import assert from 'node:assert/strict';
import { events, media, organization } from '../src/data';

const event = (id: string) => events.find(record => record.id === id)!;

test('separate World Cup screenings retain their match dates and final venue', () => {
  const morocco = event('world-cup-iran-morocco-2018');
  const spain = event('world-cup-iran-spain-2018');
  const portugal = event('world-cup-iran-portugal-2018');
  assert.deepEqual([morocco.date.value, spain.date.value, portugal.date.value], ['2018-06-15', '2018-06-20', '2018-06-25']);
  assert.equal(spain.venue, 'Palo Verde Clubhouse');
  assert.equal(portugal.venue, '7000 Palo Verde Road, UC Irvine');
  assert.match(portugal.summary, /moved.*clubhouse.*7000 Palo Verde/i);
  for (const screening of [morocco, spain, portugal]) {
    assert.equal(screening.registration, 'closed');
    assert.equal(screening.startInstant, null);
    assert.ok(screening.gallery.every(id => media.find(record => record.id === id)?.eventId === screening.id));
  }
});

test('cancelled and rescheduled invitations retain their later outcome', () => {
  for (const id of ['nowruz-2020', 'spring-bonfire-2021']) {
    const record = event(id);
    assert.equal(record.eventState, 'cancelled');
    assert.equal(record.archiveLabel, 'Archived announcement');
    assert.equal(record.registration, 'closed');
    assert.equal(record.generateCalendarDownload, false);
    assert.equal(record.generateEventStructuredData, false);
    assert.match(record.summary, /cancelled/i);
  }
  assert.equal(event('bonfire-2018-10-20').eventState, 'completed');
  assert.match(event('bonfire-2018-10-20').summary, /October 20.*October 13/);
});

test('recovered places and poster associations do not fill unrelated date gaps', () => {
  assert.equal(event('welcome-2019').venue, 'Verano Housing Office, UC Irvine');
  assert.equal(event('pol-media-film-weekend-2019').venue, 'Triangle Square Cinemas');
  assert.equal(event('secrets-of-the-surface-2020').venue, 'Online');
  assert.equal(event('nowruz-2022').date.value, null);
  assert.equal(event('nowruz-2022').venue, null);
  assert.equal(event('graduate-orientation-2019').date.value, null);
  assert.equal(event('yalda-2021').venue, null);
  const welcome = event('welcome-2020');
  assert.deepEqual(welcome.date, { value: null, precision: 'year_context', contextYear: 2020 });
  assert.equal(welcome.startInstant, null);
  assert.equal(welcome.generateCalendarDownload, false);
  assert.equal(media.find(record => record.id === 'posters-and-venues-image-041')?.eventId, 'summer-party-2018-06-16');
  assert.equal(event('summer-party-2018-06-16').date.value, '2018-06-16');
});

test('shared invitations keep third-party organizers separate from SIGS', () => {
  for (const id of ['maryam-mirzakhani-memorial-2017', 'standup-yost-memorial-day-2019', 'ali-azimi-los-angeles-2019', 'behrouz-documentary-2023', 'csulb-nowruz-2025']) {
    assert.equal(event(id).sigsRole, 'shared_invitation');
    assert.equal(event(id).generateEventStructuredData, false);
  }
  assert.deepEqual(organization.socialChannels, [{ name: 'Instagram', url: 'https://www.instagram.com/sigs_uci/' }]);
});

test('the two March 2024 Nowruz invitations stay distinct', () => {
  const campus = event('nowruz-gathering-2024');
  const joint = event('usc-sigs-nowruz-2024');
  assert.deepEqual([campus.date.value, joint.date.value], ['2024-03-19', '2024-03-25']);
  assert.match(campus.venue ?? '', /Verano/);
  assert.match(joint.venue ?? '', /Trojan Grand Ballroom/);
  assert.equal(campus.sigsRole, 'organizer');
  assert.equal(joint.sigsRole, 'co-organizer');
  assert.equal(joint.archiveLabel, 'Archived announcement');
  assert.equal(event('usc-ucla-nowruz-2022').sigsRole, 'shared_invitation');
});
