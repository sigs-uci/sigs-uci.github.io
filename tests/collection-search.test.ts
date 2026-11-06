import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesCollection } from '../src/lib/collection-search';
import { setupCollectionSearch } from '../src/scripts/collection-search';

test('album search matches Persian letters, joiners, digits and words across fields', () => {
  assert.equal(matchesCollection('Yalda 2018 یلدای ۲۰۱۸ UCI Student Center', 'yalda ۲۰۱۸'), true);
  assert.equal(matchesCollection('دورهمی در یلدای ۲۰۱۸', 'دورهمي ٢٠١٨'), true);
  assert.equal(matchesCollection('خوشامدگویی تازه‌واردان ۲۰۲۳', 'تازه واردان 2023'), true);
  assert.equal(matchesCollection('Yalda 2018', 'yalda 2023'), false);
  assert.equal(matchesCollection('Yalda 2018', '   '), true);
});

test('album search restores links, resets no results and follows browser Back', () => {
  const browser = new EventTarget();
  const location = { href: 'https://sigs-uci.github.io/fa/community/memories/?q=یلدا&keep=1#photo-collections' };
  const writes: string[] = [];
  const globals = new Map(['window', 'location', 'history'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: browser }, location: { configurable: true, value: location },
    history: { configurable: true, value: { pushState: (_state: unknown, _unused: string, url: URL) => { location.href = url.href; writes.push(url.href); } } },
  });
  try {
    const input = Object.assign(new EventTarget(), { value: '', focused: false, focus() { this.focused = true; } });
    const form = Object.assign(new EventTarget(), { hidden: true, querySelector: () => input });
    const rows = ['Yalda 2018 یلدا', 'Welcome 2023 خوشامدگویی'].map(text => ({ hidden: false, dataset: { collectionSearchText: text } }));
    const status = { textContent: '' };
    const empty = { hidden: true };
    const elements = new Map<string, unknown>([['[data-collection-search]', form], ['[data-collection-count]', status], ['[data-collection-empty]', empty]]);
    const root = { dataset: { locale: 'fa', single: 'آلبوم', plural: 'آلبوم' }, querySelector: (key: string) => elements.get(key), querySelectorAll: () => rows } as unknown as HTMLElement;
    setupCollectionSearch(root);
    assert.equal(form.hidden, false);
    assert.equal(input.value, 'یلدا');
    assert.deepEqual(rows.map(row => row.hidden), [false, true]);
    assert.equal(status.textContent, '۱ آلبوم');
    input.value = 'not an event';
    input.dispatchEvent(new Event('input'));
    assert.equal(empty.hidden, false);
    assert.equal(status.textContent, '۰ آلبوم');
    const submit = new Event('submit', { cancelable: true });
    form.dispatchEvent(submit);
    assert.equal(submit.defaultPrevented, true);
    assert.equal(new URL(location.href).searchParams.get('q'), 'not an event');
    assert.equal(new URL(location.href).searchParams.get('keep'), '1');
    assert.equal(new URL(location.href).hash, '#photo-collections');
    const reset = new Event('reset', { cancelable: true });
    form.dispatchEvent(reset);
    assert.equal(reset.defaultPrevented, true);
    assert.equal(input.value, '');
    assert.equal(input.focused, true);
    assert.equal(empty.hidden, true);
    assert.deepEqual(rows.map(row => row.hidden), [false, false]);
    assert.equal(new URL(location.href).searchParams.has('q'), false);
    location.href = writes[0];
    browser.dispatchEvent(new Event('popstate'));
    assert.equal(input.value, 'not an event');
    assert.equal(empty.hidden, false);
    input.value = 'Welcome';
    input.dispatchEvent(new Event('input'));
    location.href = 'https://sigs-uci.github.io/fa/community/memories/?q=۲۰۲۳';
    browser.dispatchEvent(new Event('popstate'));
    assert.equal(input.value, '۲۰۲۳');
    assert.deepEqual(rows.map(row => row.hidden), [true, false]);
  } finally {
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
