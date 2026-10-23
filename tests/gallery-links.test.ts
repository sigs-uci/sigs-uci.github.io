import test from 'node:test';
import assert from 'node:assert/strict';
import { setupGalleryLinks } from '../src/scripts/gallery-links';

function fixture() {
  const link = { href: 'https://sigs-uci.github.io/media/tales-2016-poster.webp' } as HTMLAnchorElement;
  const root = Object.assign(new EventTarget(), { closest: () => link, contains: (value: unknown) => value === link });
  return { root, element: root as unknown as HTMLElement, link };
}
function click(modifiers: Partial<{ button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }> = {}) {
  return Object.assign(new Event('click', { cancelable: true }), { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, ...modifiers });
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

test('modified image clicks retain normal browser navigation instead of opening a dialog', async () => {
  const { root, element } = fixture();
  let loads = 0;
  setupGalleryLinks(element, async () => { loads++; return () => {}; });
  for (const modifiers of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const event = click(modifiers);
    root.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  }
  await settle();
  assert.equal(loads, 0);
});

test('a failed image-viewer preload can retry on activation', async () => {
  const { root, element, link } = fixture();
  let loads = 0;
  const opened: HTMLAnchorElement[] = [];
  setupGalleryLinks(element, async () => { if (++loads === 1) throw new Error('Transient preload failure'); return item => opened.push(item); });
  root.dispatchEvent(new Event('pointerenter'));
  await settle();
  const event = click();
  root.dispatchEvent(event);
  await settle();
  assert.equal(event.defaultPrevented, true);
  assert.equal(loads, 2);
  assert.deepEqual(opened, [link]);
});

test('failed activation follows the existing full image URL as a working fallback', async () => {
  const { root, element, link } = fixture();
  const navigated: string[] = [];
  setupGalleryLinks(element, async () => { throw new Error('Viewer unavailable'); }, url => navigated.push(url));
  root.dispatchEvent(click());
  await settle();
  assert.deepEqual(navigated, [link.href]);
});
