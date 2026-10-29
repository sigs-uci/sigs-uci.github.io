import test from 'node:test';
import assert from 'node:assert/strict';
import { data, validatePublicData, type StoryRecord } from '../src/data';
import { isPublicStory } from '../src/lib/publication';

const fixture = (): StoryRecord => ({ id: 'test-story', slug: 'test-story', title: 'Example story for isolated tests',
  summary: 'A story fixture.', locale: 'en', publication: 'published', editorial: 'reviewed', publishedOn: '2026-10-22',
  body: ['A fixture paragraph.'], relatedEventIds: [], mediaIds: [], kind: 'story', credit: null });

test('historical documents need readable text and context before either language can publish', () => {
  for (const locale of ['en', 'fa'] as const) {
    const copy = structuredClone(data);
    const document: StoryRecord = { ...fixture(), locale, kind: 'document', body: [], contextNote: 'This is a historical test document.' };
    copy.stories.push(document);
    assert.equal(isPublicStory(document), false);
    assert.ok(validatePublicData(copy).some(error => error.includes('historical context and readable text')));
    document.body = ['A historical paragraph for the isolated fixture.'];
    assert.deepEqual(validatePublicData(copy), []);
    assert.equal(isPublicStory(document), true);
    delete document.contextNote;
    assert.equal(isPublicStory(document), false);
    assert.ok(validatePublicData(copy).some(error => error.includes('historical context and readable text')));
  }
});

test('story publishing rejects colliding routes, invalid dates and synthetic records', () => {
  const copy = structuredClone(data);
  const position = copy.stories.length;
  copy.stories.push(fixture());
  assert.deepEqual(validatePublicData(copy), []);
  copy.stories.push({ ...fixture(), id: 'test-other-story' });
  assert.ok(validatePublicData(copy).some(error => error.includes('Story URL')));
  copy.stories.pop();
  copy.stories[position].publishedOn = '2026-02-30';
  assert.ok(validatePublicData(copy).some(error => error.includes('Publication date')));
  copy.stories[position] = Object.assign(fixture(), { synthetic: true });
  assert.equal(isPublicStory(copy.stories[position]), false);
  assert.ok(validatePublicData(copy).some(error => error.includes('unsupported field')));
});

test('a draft story cannot become public through an English locale or an invalid review state', () => {
  const story = { ...fixture(), editorial: 'draft' as const };
  const copy = structuredClone(data);
  const position = copy.stories.length;
  copy.stories.push(story);
  assert.equal(isPublicStory(story), false);
  assert.ok(validatePublicData(copy).some(error => error.includes('reviewed text')));
  copy.stories[position] = { ...fixture(), locale: 'unknown' as StoryRecord['locale'] };
  assert.ok(validatePublicData(copy).some(error => error.includes('Unknown story locale')));
});
