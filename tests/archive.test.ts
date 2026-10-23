import test from 'node:test';
import assert from 'node:assert/strict';
import { events } from '../src/data';
import { archiveYears } from '../src/lib/archive';
import { eventFixture } from './fixtures/events';

test('year archives retain each canonical historical record exactly once', () => {
  const years = archiveYears();
  const listed = years.flatMap(year => year.records.map(record => record.id));
  assert.deepEqual([...listed].sort(), events.map(event => event.id).sort());
  assert.equal(new Set(listed).size, listed.length);
  assert.equal(years.find(year => year.year === '2019')?.records.length, 3);
  assert.equal(years.find(year => year.year === '2026')?.records.length, 2);
  assert.equal(years.some(year => year.year === '2020'), false);
  assert.equal(years.flatMap(year => year.records).filter(event => event.archiveLabel === 'Archived announcement').length, 11);
});

test('archive grouping preserves partial years while omitting unpublished or future fixtures', () => {
  const partial = eventFixture({ id: 'test-partial-date', slug: 'test-partial-date',
    date: { value: null, precision: 'year_context', contextYear: 2012 }, startInstant: null, endInstant: null });
  const draft = eventFixture({ id: 'test-draft', publication: 'draft' });
  const future = eventFixture({ id: 'test-future', archiveLabel: null });
  const synthetic = { ...eventFixture({ id: 'test-synthetic' }), synthetic: true };
  const records = archiveYears([partial, draft, future, synthetic]);
  assert.deepEqual(records.map(year => year.year), ['2012']);
  assert.deepEqual(records[0].records.map(event => event.id), ['test-partial-date']);
});
