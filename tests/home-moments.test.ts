import test from 'node:test';
import assert from 'node:assert/strict';
import { setupHomeMoments } from '../src/scripts/home-moments';

function fixture(rtl = false, reducedMotion = false) {
  const bounds = (index = 0, width = 100) => {
    const left = rtl ? 100 - width - index * 120 : index * 120;
    return { left, right: left + width, width };
  };
  const videos = [0, 1].map(() => Object.assign(new EventTarget(), { pauses: 0, pause() { this.pauses++; } }));
  const moments = [0, 1, 2].map(index => ({
    getBoundingClientRect: () => bounds(index), contains: (video: unknown) => video === videos[index],
  }));
  const links = moments.map((_, index) => {
    const attributes = new Map([['aria-label', `Moment ${index + 1}`]]);
    return Object.assign(new EventTarget(), {
      getBoundingClientRect: () => bounds(index, 72),
      getAttribute: (name: string) => attributes.get(name),
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
    });
  });
  const scrolls: ScrollToOptions[] = [];
  const track = Object.assign(new EventTarget(), {
    getBoundingClientRect: () => bounds(),
    querySelectorAll: (selector: string) => selector === 'video' ? videos : moments,
    scrollBy: (options: ScrollToOptions) => scrolls.push(options),
  });
  const thumbnails = { querySelectorAll: () => links, getBoundingClientRect: () => bounds(), scrollBy() {} };
  const previous = Object.assign(new EventTarget(), { disabled: false });
  const next = Object.assign(new EventTarget(), { disabled: false });
  const count = { textContent: '' };
  const status = { textContent: '' };
  const controls = { hidden: true };
  const nodes: Record<string, unknown> = {
    '[data-moments-track]': track, '[data-moments-thumbnails]': thumbnails,
    '[data-moments-prev]': previous, '[data-moments-next]': next,
    '[data-moments-count]': count, '[data-moments-status]': status, '[data-moments-controls]': controls,
  };
  const root = Object.assign(new EventTarget(), { querySelector: (selector: string) => nodes[selector] });
  const document = Object.assign(new EventTarget(), { documentElement: { lang: rtl ? 'fa' : 'en', dir: rtl ? 'rtl' : 'ltr' }, hidden: false });
  const window = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: reducedMotion }) });
  const descriptors = ['document', 'window'].map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const);
  Object.defineProperty(globalThis, 'document', { value: document, configurable: true });
  Object.defineProperty(globalThis, 'window', { value: window, configurable: true });
  const restore = () => descriptors.forEach(([name, descriptor]) => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  });
  return { root: root as unknown as HTMLElement, track, links, previous, next, count, status, controls, videos, scrolls, document, restore };
}

test('carousel controls and native video coordination work without IntersectionObserver', () => {
  const f = fixture();
  try {
    setupHomeMoments(f.root);
    assert.equal(f.controls.hidden, false);
    assert.equal(f.previous.disabled, true);
    assert.equal(f.next.disabled, false);
    f.next.dispatchEvent(new Event('click'));
    assert.equal(f.count.textContent, '2 / 3');
    assert.deepEqual(f.scrolls[0], { left: 120, behavior: 'smooth' });
    f.videos[1].dispatchEvent(new Event('play'));
    assert.equal(f.videos[0].pauses, 1);
    assert.equal(f.videos[1].pauses, 0);
    f.document.hidden = true;
    f.document.dispatchEvent(new Event('visibilitychange'));
    assert.equal(f.videos[0].pauses, 2);
    assert.equal(f.videos[1].pauses, 1);
  } finally { f.restore(); }
});

test('Persian keyboard direction respects reduced motion and modified thumbnail links', () => {
  const f = fixture(true, true);
  try {
    setupHomeMoments(f.root);
    const key = Object.assign(new Event('keydown', { cancelable: true }), { key: 'ArrowLeft' });
    f.track.dispatchEvent(key);
    assert.equal(key.defaultPrevented, true);
    assert.deepEqual(f.scrolls[0], { left: -120, behavior: 'instant' });
    assert.equal(f.links[1].getAttribute('aria-current'), 'true');
    const modified = Object.assign(new Event('click', { cancelable: true }), { button: 0, ctrlKey: true });
    f.links[2].dispatchEvent(modified);
    assert.equal(modified.defaultPrevented, false);
    assert.equal(f.scrolls.length, 1);
    const end = Object.assign(new Event('keydown', { cancelable: true }), { key: 'End' });
    f.track.dispatchEvent(end);
    assert.deepEqual(f.scrolls[1], { left: -240, behavior: 'instant' });
    assert.equal(f.next.disabled, true);
    assert.match(f.status.textContent, /Moment 3/);
  } finally { f.restore(); }
});
