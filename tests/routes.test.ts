import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPages, legacyRedirects } from '../src/lib/routes';

test('public routes keep the event archive without publishing a team directory', () => {
  const pages = buildPages();
  assert.ok(pages.some(page => page.path === 'about'));
  assert.ok(pages.some(page => page.path === 'about/history'));
  assert.ok(pages.some(page => page.path === 'events/archive'));
  assert.ok(pages.every(page => !page.path.startsWith('about/leadership')));
  assert.equal(new Set(pages.map(page => page.path)).size, pages.length);
});

test('old directory links redirect to About without importing personal records', () => {
  assert.equal(legacyRedirects.length, 20);
  assert.equal(new Set(legacyRedirects.map(page => page.path)).size, legacyRedirects.length);
  assert.ok(legacyRedirects.every(page => page.redirectTo === 'about' && page.title === 'About SIGS'));
  assert.ok(legacyRedirects.some(page => page.path === 'about/leadership'));
  for (let year = 2008; year <= 2026; year++) {
    assert.ok(legacyRedirects.some(page => page.path === `about/leadership/${year}-${year + 1}`));
  }
});
