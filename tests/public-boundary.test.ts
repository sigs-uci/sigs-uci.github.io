import assert from 'node:assert/strict';
import test from 'node:test';
import { data, media, validatePublicData, type PublicData } from '../src/data';
import { publicMedia, validateMediaCollections } from '../src/lib/media';

test('public data accepts organization contacts and rejects directory collections', () => {
  assert.deepEqual(validatePublicData(data), []);
  for (const field of ['people', 'boardTerms']) {
    const copy = structuredClone(data) as PublicData & Record<string, unknown>;
    copy[field] = [];
    assert.ok(validatePublicData(copy).some(error => error === 'data: Contains an unsupported public collection'));
  }
  for (const field of ['currentBoard', 'currentBoardTermId', 'currentBoardNotice']) {
    const copy = structuredClone(data);
    Object.assign(copy.organization, { [field]: [] });
    assert.ok(validatePublicData(copy).some(error => error === 'organization: Contains an unsupported public field'));
  }
});

test('individual profile assets cannot return through the media collection', () => {
  assert.ok(media.every(item => !item.src.startsWith('/media/team/')));
  assert.deepEqual(publicMedia, media.filter(item => item.publication === 'published' && item.rights === 'approved'));
  assert.deepEqual(validateMediaCollections(), []);
  const copy = structuredClone(data);
  copy.media[0].src = '/media/team/example-profile.webp';
  assert.ok(validatePublicData(copy).some(error => error.includes('Individual team profiles do not belong in public media')));
});
