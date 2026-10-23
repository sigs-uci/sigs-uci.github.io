import test from 'node:test';
import assert from 'node:assert/strict';
import { data, validatePublicData, type StoryRecord } from '../src/data';
import { isPublicStory } from '../src/lib/publication';

const fixture = (): StoryRecord => ({ id: 'test-story', slug: 'test-story', title: 'Example story for isolated tests',
  summary: 'A story fixture.', locale: 'en', publication: 'published', editorial: 'reviewed', publishedOn: '2026-10-22',
  body: ['A fixture paragraph.'], relatedEventIds: [], mediaIds: [], kind: 'story', credit: null });

test('story publishing rejects colliding routes, invalid dates and synthetic records', () => {
  const copy = structuredClone(data);
  copy.stories.push(fixture());
  assert.deepEqual(validatePublicData(copy), []);
  copy.stories.push({ ...fixture(), id: 'test-other-story' });
  assert.ok(validatePublicData(copy).some(error => error.includes('Story URL')));
  copy.stories.pop();
  copy.stories[0].publishedOn = '2026-02-30';
  assert.ok(validatePublicData(copy).some(error => error.includes('Publication date')));
  copy.stories[0] = Object.assign(fixture(), { synthetic: true });
  assert.equal(isPublicStory(copy.stories[0]), false);
  assert.ok(validatePublicData(copy).some(error => error.includes('unsupported field')));
});

test('a draft story cannot become public through an English locale or an invalid review state', () => {
  const story = { ...fixture(), editorial: 'draft' as const };
  const copy = structuredClone(data);
  copy.stories.push(story);
  assert.equal(isPublicStory(story), false);
  assert.ok(validatePublicData(copy).some(error => error.includes('reviewed text')));
  copy.stories[0] = { ...fixture(), locale: 'unknown' as StoryRecord['locale'] };
  assert.ok(validatePublicData(copy).some(error => error.includes('Unknown story locale')));
});
