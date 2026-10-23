import { createSearchRunner, searchWithVariants } from '../lib/search';

export interface SearchResult { url: string; meta: { title?: string }; excerpt: string; }
const indexUrl = '/pagefind/pagefind.js';
export function setupSearch(root: HTMLElement, lookup?: (query: string) => Promise<SearchResult[]>) {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  const list = root.querySelector<HTMLOListElement>('[data-search-results]')!;
  let pagefind: { search: (query: string) => Promise<{ results: { data: () => Promise<SearchResult> }[] }> };
  const runner = createSearchRunner<SearchResult>(lookup ?? (async query => {
    pagefind ??= await import(/* @vite-ignore */ indexUrl);
    return searchWithVariants(query, async variant => {
      const result = await pagefind.search(variant);
      return Promise.all(result.results.map(record => record.data()));
    });
  }));
  const clear = (updateUrl = false) => {
    runner.cancel();
    list.replaceChildren();
    status.textContent = '';
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.delete('q');
      if (url.href !== location.href) history.replaceState(null, '', url);
    }
  };
  const search = async () => {
    const query = input.value.trim();
    if (!query) { clear(); return; }
    status.textContent = root.dataset.loading!;
    list.replaceChildren();
    try {
      const results = await runner.run(query);
      if (!results) return;
      status.textContent = results.length ? `${new Intl.NumberFormat(document.documentElement.lang, { useGrouping: false }).format(results.length)} ${results.length === 1 ? root.dataset.single : root.dataset.found}` : root.dataset.empty!;
      results.forEach(item => {
        const li = document.createElement('li');
        const heading = document.createElement('h2');
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.meta.title ?? item.url;
        heading.append(link);
        const paragraph = document.createElement('p');
        const parsed = new DOMParser().parseFromString(item.excerpt, 'text/html');
        for (const node of Array.from(parsed.body.childNodes)) {
          if (node instanceof HTMLElement && node.tagName === 'MARK') {
            const mark = document.createElement('mark');
            mark.textContent = node.textContent;
            paragraph.append(mark);
          } else paragraph.append(document.createTextNode(node.textContent ?? ''));
        }
        li.append(heading, paragraph);
        list.append(li);
      });
    } catch { status.textContent = root.dataset.error!; }
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!input.value.trim()) { clear(true); return; }
    const url = new URL(location.href);
    url.searchParams.set('q', input.value);
    if (url.href !== location.href) history.pushState(null, '', url);
    search();
  });
  input.addEventListener('input', () => { if (!input.value.trim()) clear(true); });
  const read = () => { input.value = new URLSearchParams(location.search).get('q') ?? ''; search(); };
  window.addEventListener('popstate', read);
  read();
}

const root = typeof document === 'undefined' ? null : document.querySelector<HTMLElement>('[data-search]');
if (root) setupSearch(root);
