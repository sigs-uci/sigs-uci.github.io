import test from 'node:test';
import assert from 'node:assert/strict';
import { data, events, programs, programDetails as details, validatePublicData } from '../src/data';
import { isPublicEvent } from '../src/lib/events';
import { buildPages } from '../src/lib/routes';
import { programLinkHref } from '../src/lib/programs';
import type { ProgramRelatedLink } from '../src/data/schema';

test('each program has one public profile route with no duplicate route destinations', () => {
  assert.deepEqual(details.map(detail => detail.id).sort(), programs.map(program => program.id).sort());
  const paths = buildPages().map(page => page.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const program of programs) assert.equal(paths.filter(path => path === `community/programs/${program.id}`).length, 1);
});

test('program context points to canonical public events and working page routes', () => {
  const paths = new Set(buildPages().map(page => page.path));
  for (const program of details) {
    assert.equal(new Set(program.relatedEventIds).size, program.relatedEventIds.length);
    for (const id of program.relatedEventIds) assert.ok(events.some(event => event.id === id && isPublicEvent(event)));
    for (const related of program.relatedPaths) {
      assert.ok(paths.has(related.path), `${program.id}: ${related.path}`);
      assert.equal(related.path.includes('..'), false);
    }
    for (const source of program.publicContextLinks) {
      const url = new URL(source.url);
      assert.ok(['https:', 'http:'].includes(url.protocol));
      assert.equal(url.username + url.password, '');
    }
  }
});

test('program validation rejects missing themes, event references and unsupported link destinations', () => {
  const brokenReference = structuredClone(data);
  brokenReference.programDetails[0].relatedEventIds.push('missing-event');
  assert.ok(validatePublicData(brokenReference).some(error => error.startsWith('programDetails.') && error.includes('Event reference')));
  const missingTheme = structuredClone(data);
  missingTheme.programDetails[0].id = 'missing-theme';
  assert.ok(validatePublicData(missingTheme).some(error => error.includes('Program theme does not exist')));
  const unsafeLink = structuredClone(data);
  unsafeLink.programDetails[0].relatedPaths[0].path = '../outside';
  assert.ok(validatePublicData(unsafeLink).some(error => error.includes('local page path')));
  const nonWebContext = structuredClone(data);
  nonWebContext.programDetails[0].publicContextLinks[0].url = 'mailto:example@example.com';
  assert.ok(validatePublicData(nonWebContext).some(error => error.includes('web URL')));
});

test('program event shortcuts retain their promised filters in both languages', () => {
  const current = details.find(program => program.id === 'docunight')!.relatedPaths.find(link => link.query?.period === 'upcoming')!;
  const cultural = details.find(program => program.id === 'cultural-celebrations')!.relatedPaths.find(link => link.query?.category === 'culture')!;
  assert.ok(current);
  assert.ok(cultural);
  for (const locale of ['en', 'fa'] as const) {
    assert.equal(programLinkHref(current, locale), `/${locale}/events/?period=upcoming`);
    assert.equal(programLinkHref(cultural, locale), `/${locale}/events/archive/?category=culture`);
    assert.equal(programLinkHref({ label: 'Read about SIGS', path: 'about' }, locale), `/${locale}/about/`);
  }
  assert.equal(programLinkHref({ label: 'Browse events', path: 'events', query: { period: 'past', category: 'film-poetry' } }, 'fa'), '/fa/events/?period=past&category=film-poetry');
});

test('program filters reject unknown keys, values and destinations', () => {
  const invalid: ProgramRelatedLink[] = [
    { label: 'No filters', path: 'events', query: {} },
    { label: 'Wrong destination', path: 'about', query: { category: 'culture' } },
    { label: 'Unknown parameter', path: 'events', query: { q: 'hidden' } } as unknown as ProgramRelatedLink,
    { label: 'Unknown period', path: 'events', query: { period: 'tomorrow' } } as unknown as ProgramRelatedLink,
    { label: 'Unknown category', path: 'events/archive', query: { category: 'other' } } as unknown as ProgramRelatedLink,
  ];
  for (const link of invalid) {
    const candidate = structuredClone(data);
    candidate.programDetails[0].relatedPaths[0] = link;
    assert.ok(validatePublicData(candidate).some(error => error.startsWith('programDetails.')), link.label);
  }
});
