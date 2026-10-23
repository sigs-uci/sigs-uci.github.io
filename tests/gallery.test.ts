import test from 'node:test';
import assert from 'node:assert/strict';
import { setupGallery } from '../src/scripts/gallery';

test('the image viewer announces the active caption and position, supports RTL keys and returns focus', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = { documentElement: { lang: 'fa', dir: 'rtl' }, activeElement: null as unknown };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  try {
    const button = () => {
      const control = Object.assign(new EventTarget(), { focus: () => { document.activeElement = control; } });
      return control;
    };
    const controls = [button(), button(), button()];
    const image = { src: '', alt: '' };
    const caption = { textContent: '' };
    const count = { textContent: '' };
    const status = { textContent: '' };
    const elements = new Map<string, unknown>([
      ['[data-gallery-close]', controls[0]], ['[data-gallery-prev]', controls[1]], ['[data-gallery-next]', controls[2]],
      ['[data-gallery-image]', image], ['[data-gallery-caption]', caption], ['[data-gallery-count]', count], ['[data-gallery-status]', status],
    ]);
    const dialog = Object.assign(new EventTarget(), { querySelector: (selector: string) => elements.get(selector),
      querySelectorAll: () => controls, showModal: () => { document.activeElement = controls[0]; }, close: () => { dialog.dispatchEvent(new Event('close')); } });
    const links = ['First image', 'Second image', 'Third image'].map((text, index) => ({ href: `/media/image-${index}.webp`,
      dataset: { caption: `${text} caption and credit` }, querySelector: () => ({ alt: text }), focus: () => { document.activeElement = links[index]; } }));
    const root = { querySelectorAll: () => links, querySelector: () => dialog } as unknown as HTMLElement;
    const open = setupGallery(root);
    open(links[0] as unknown as HTMLAnchorElement);
    assert.equal(status.textContent, '۱ / ۳. First image caption and credit');
    controls[2].dispatchEvent(new Event('click'));
    assert.equal(count.textContent, '۲ / ۳');
    assert.equal(image.alt, 'Second image');
    assert.equal(caption.textContent, 'Second image caption and credit');
    assert.equal(status.textContent, '۲ / ۳. Second image caption and credit');
    const key = (value: string, shiftKey = false) => Object.assign(new Event('keydown', { cancelable: true }), { key: value, shiftKey });
    dialog.dispatchEvent(key('ArrowLeft'));
    assert.equal(image.alt, 'Third image');
    document.activeElement = controls[2];
    dialog.dispatchEvent(key('Tab'));
    assert.equal(document.activeElement, controls[0]);
    dialog.dispatchEvent(key('Tab', true));
    assert.equal(document.activeElement, controls[2]);
    controls[0].dispatchEvent(new Event('click'));
    assert.equal(document.activeElement, links[0]);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'document', descriptor);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
