import test from 'node:test';
import assert from 'node:assert/strict';
import { languageSwitchHref } from '../src/lib/language';

test('switching the event archive language retains filters and calendar state', () => {
  const current = new URL('https://sigs-uci.github.io/en/events/archive/?period=all&year=2019&category=culture&q=Yalda&view=calendar&month=2019-12&extra=unused#event-results');
  const target = new URL(languageSwitchHref('/fa/events/archive/', current));
  assert.equal(target.pathname, '/fa/events/archive/');
  assert.equal(target.hash, '#event-results');
  for (const key of ['period', 'year', 'category', 'q', 'view', 'month']) assert.equal(target.searchParams.get(key), current.searchParams.get(key));
  assert.equal(target.searchParams.has('extra'), false);
});

test('search terms and shared deep links survive a language change', () => {
  assert.equal(new URL(languageSwitchHref('/en/search/', new URL('https://sigs-uci.github.io/fa/search/?q=یلدا'))).searchParams.get('q'), 'یلدا');
  assert.equal(languageSwitchHref('/fa/about/leadership/', new URL('https://sigs-uci.github.io/en/about/leadership/#kourosh-mirsohi')), 'https://sigs-uci.github.io/fa/about/leadership/#kourosh-mirsohi');
});

test('a fallback page does not inherit an unrelated query or anchor', () => {
  assert.equal(languageSwitchHref('/fa/', new URL('https://sigs-uci.github.io/en/community/stories/example/?q=example#memory')), 'https://sigs-uci.github.io/fa/');
  assert.equal(languageSwitchHref('/fa/contact/', new URL('https://sigs-uci.github.io/en/contact/?extra=unused')), 'https://sigs-uci.github.io/fa/contact/');
});
