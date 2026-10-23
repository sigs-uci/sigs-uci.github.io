import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPages } from '../src/lib/routes';
import { boardTerms } from '../src/data';

test('a new team term receives a durable route and current-team metadata', () => {
  const terms = structuredClone(boardTerms);
  terms.forEach(term => term.status = 'former');
  terms.unshift({ id: '2027-2028', term: '2027-2028', status: 'current', people: [] });
  const pages = buildPages(terms, '2027-2028');
  assert.ok(pages.some(page => page.path === 'about/leadership/2027-2028'));
  assert.match(pages.find(page => page.path === 'about/leadership')!.description, /2027-2028/);
  for (const term of boardTerms) assert.ok(pages.some(page => page.path === `about/leadership/${term.id}`));
  assert.equal(new Set(pages.map(page => page.path)).size, pages.length);
});
