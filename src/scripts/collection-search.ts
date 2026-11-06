import { matchesCollection } from '../lib/collection-search';

export function setupCollectionSearch(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('[data-collection-search]')!;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const rows = [...root.querySelectorAll<HTMLElement>('[data-collection-search-text]')];
  const status = root.querySelector<HTMLElement>('[data-collection-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-collection-empty]')!;
  const number = new Intl.NumberFormat(root.dataset.locale, { useGrouping: false });
  let timer: ReturnType<typeof setTimeout>;
  const filter = () => {
    let count = 0;
    for (const row of rows) {
      row.hidden = !matchesCollection(row.dataset.collectionSearchText ?? '', input.value);
      if (!row.hidden) count++;
    }
    status.textContent = `${number.format(count)} ${count === 1 ? root.dataset.single : root.dataset.plural}`;
    empty.hidden = count > 0;
  };
  const save = () => {
    const url = new URL(location.href);
    const query = input.value.trim();
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    if (url.href !== location.href) history.pushState(null, '', url);
  };
  const read = () => {
    clearTimeout(timer);
    input.value = new URL(location.href).searchParams.get('q') ?? '';
    filter();
  };
  input.addEventListener('input', () => {
    filter();
    clearTimeout(timer);
    timer = setTimeout(save, 250);
  });
  form.addEventListener('submit', event => { event.preventDefault(); clearTimeout(timer); filter(); save(); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    clearTimeout(timer);
    input.value = '';
    filter();
    save();
    input.focus();
  });
  window.addEventListener('popstate', read);
  window.addEventListener('pagehide', () => clearTimeout(timer));
  read();
  form.hidden = false;
}
