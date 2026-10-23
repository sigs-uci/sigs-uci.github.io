import { normalizeSearch } from '../lib/events';
import { createSearchRunner } from '../lib/search';

interface SearchResult { url: string; meta: { title?: string }; excerpt: string; }
const root = document.querySelector<HTMLElement>('[data-search]');
const indexUrl = '/pagefind/pagefind.js';
if (root) {
  const form = root.querySelector<HTMLFormElement>('form')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const status = root.querySelector<HTMLElement>('[data-search-status]')!;
  const list = root.querySelector<HTMLOListElement>('[data-search-results]')!;
  let pagefind: { search: (query: string) => Promise<{ results: { data: () => Promise<SearchResult> }[] }> };
  const runner = createSearchRunner<SearchResult>(async query => {
    pagefind ??= await import(/* @vite-ignore */ indexUrl);
    const result = await pagefind.search(normalizeSearch(query));
    return Promise.all(result.results.map(record => record.data()));
  });
  const search = async () => {
    const query = input.value.trim();
    if (!query) { runner.cancel(); list.replaceChildren(); status.textContent = ''; return; }
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
    const url = new URL(location.href);
    url.searchParams.set('q', input.value);
    history.pushState(null, '', url);
    search();
  });
  const read = () => { input.value = new URLSearchParams(location.search).get('q') ?? ''; search(); };
  window.addEventListener('popstate', read);
  read();
}
