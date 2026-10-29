import test from 'node:test';
import assert from 'node:assert/strict';
import { boardTerms, data, people, validatePublicData } from '../src/data';
import type { PersonRecord } from '../src/data/schema';

test('the 2026 roster has distinct public professional profiles', () => {
  const current = boardTerms.find(term => term.id === '2026-2027')!;
  const profiles = current.people.map(member => people.find(person => person.id === member.personId)?.linkedinUrl);
  assert.equal(profiles.length, 8);
  assert.ok(profiles.every(url => url?.startsWith('https://www.linkedin.com/in/')));
  assert.equal(new Set(profiles).size, profiles.length);
});

test('professional contacts reject login pages, tracking and unrelated destinations', () => {
  const invalid = [
    'http://www.linkedin.com/in/example-person',
    'https://www.linkedin.com/login',
    'https://www.linkedin.com/company/example',
    'https://www.linkedin.com/in/example-person?trackingId=example',
    'https://www.linkedin.com/in/example-person#contact-info',
    'https://www.linkedin.com.example.com/in/example-person',
    'https://example.invalid/in/example-person',
  ];
  for (const linkedinUrl of invalid) {
    const copy = structuredClone(data);
    copy.people[0].linkedinUrl = linkedinUrl;
    assert.ok(validatePublicData(copy).some(error => error.startsWith(`people.${copy.people[0].id}`) && error.includes('LinkedIn')), linkedinUrl);
  }
  for (const value of [undefined, null, 'https://www.linkedin.com/in/example-person/']) {
    const copy = structuredClone(data);
    copy.people[0].linkedinUrl = value;
    assert.ok(!validatePublicData(copy).some(error => error.includes('LinkedIn')));
  }
});

test('professional profile updates preserve the approved term contacts', () => {
  assert.equal(boardTerms.find(term => term.id === '2026-2027')?.people[0].telegramUrl, 'https://t.me/KMirso');
  assert.equal(boardTerms.find(term => term.id === '2025-2026')?.people[0].telegramUrl, 'http://t.me/KMirsohi');
});

test('academic majors are optional and require complete English and Persian text', () => {
  for (const major of [undefined, null, { en: 'Physics', fa: 'فیزیک' }]) {
    const copy = structuredClone(data);
    copy.people[0].major = major;
    assert.deepEqual(validatePublicData(copy), []);
  }
});

test('academic major validation rejects incomplete, blank and unrelated fields', () => {
  const invalid: unknown[] = [
    {}, { en: 'Physics' }, { fa: 'فیزیک' }, { en: '', fa: 'فیزیک' },
    { en: 'Physics', fa: '  ' }, { en: 'Physics', fa: 'فیزیک', source: 'Unreviewed detail' },
    { en: 'Physics', fa: 1 }, ['Physics', 'فیزیک'], 'Physics', 42,
  ];
  for (const major of invalid) {
    const copy = structuredClone(data);
    copy.people[0].major = major as PersonRecord['major'];
    assert.ok(validatePublicData(copy).some(error => error.startsWith(`people.${copy.people[0].id}`)
      && error.includes('Academic majors')), JSON.stringify(major));
  }
});
