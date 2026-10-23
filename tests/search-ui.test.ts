import test from 'node:test';
import assert from 'node:assert/strict';
import { setupSearch, type SearchResult } from '../src/scripts/search';

test('clearing the actual search control removes its URL query and cancels an in-flight result', async () => {
  const browser = new EventTarget();
  const location = { href: 'https://sigs-uci.github.io/fa/search/?q=Yalda&keep=1#main', search: '?q=Yalda&keep=1' };
  const writeUrl = (_state: unknown, _unused: string, value: string | URL) => {
    location.href = String(value);
    location.search = new URL(location.href).search;
  };
  const globals = new Map(['window', 'location', 'history'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: browser }, location: { configurable: true, value: location },
    history: { configurable: true, value: { replaceState: writeUrl, pushState: writeUrl } },
  });
  try {
    const input = Object.assign(new EventTarget(), { value: '' });
    const form = Object.assign(new EventTarget(), { querySelector: () => input });
    const status = { textContent: '' };
    let clearCount = 0;
    const list = { replaceChildren: () => { clearCount++; }, append: () => { throw new Error('A cancelled result must not render'); } };
    const elements = new Map<string, unknown>([['form', form], ['input', input], ['[data-search-status]', status], ['[data-search-results]', list]]);
    const root = { querySelector: (selector: string) => elements.get(selector), dataset: { loading: 'Searching', empty: 'No results', error: 'Search failed' } } as unknown as HTMLElement;
    let finish!: (results: SearchResult[]) => void;
    const queries: string[] = [];
    setupSearch(root, query => { queries.push(query); return new Promise(resolve => { finish = resolve; }); });
    assert.equal(status.textContent, 'Searching');
    assert.equal(input.value, 'Yalda');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    assert.equal(status.textContent, '');
    assert.equal(new URL(location.href).searchParams.has('q'), false);
    assert.equal(new URL(location.href).searchParams.get('keep'), '1');
    assert.equal(new URL(location.href).hash, '#main');
    finish([{ url: '/fa/events/yalda-2025/', meta: { title: 'Old result' }, excerpt: 'An obsolete result' }]);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(status.textContent, '');
    assert.ok(clearCount >= 2);
    location.href = 'https://sigs-uci.github.io/fa/search/?q=Nowruz';
    location.search = '?q=Nowruz';
    browser.dispatchEvent(new Event('popstate'));
    assert.deepEqual(queries, ['Yalda', 'Nowruz']);
    assert.equal(input.value, 'Nowruz');
    finish([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(status.textContent, 'No results');
  } finally {
    for (const [key, descriptor] of globals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
