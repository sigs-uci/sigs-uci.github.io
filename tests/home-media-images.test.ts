import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { imageMetadata } from 'astro/assets/utils';
import { publicMedia } from '../src/lib/media';
import { events } from '../src/data';
import { isPublicEvent } from '../src/lib/events';

test('homepage image candidates declare the real widths of their public thumbnails', async () => {
  const component = await readFile(new URL('../src/components/HomeMedia.astro', import.meta.url), 'utf8');
  const selected = [...component.match(/const selected = \[([\s\S]*?)\];/)![1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  const declaredOverrides = component.match(/const thumbnailWidths: Record<string, number> = \{([^}]+)\}/)![1];
  const overrides = new Map([...declaredOverrides.matchAll(/'([^']+)'\s*:\s*(\d+)/g)].map(match => [match[1], Number(match[2])]));
  const defaultWidth = Number(component.match(/\$\{thumbnailWidths\[item.id\] \?\? (\d+)\}w/)![1]);
  const photos = selected.map(id => publicMedia.find(item => item.id === id)!).filter(item => item.kind !== 'video');
  assert.equal(selected.length, 20);
  assert.equal(photos.length, 12);
  assert.ok([...overrides.keys()].every(id => photos.some(item => item.id === id)));
  assert.ok(component.includes('${item.src} ${item.width}w'));
  for (const image of photos) {
    assert.ok(image.thumbnail, image.id);
    const filename = new URL(`../public${image.thumbnail}`, import.meta.url);
    const actual = await imageMetadata(await readFile(filename), image.thumbnail);
    assert.equal(overrides.get(image.id) ?? defaultWidth, actual.width, image.id);
    assert.ok(actual.width < image.width, image.id);
  }
});

test('expanded homepage keeps the previous moments and links each addition to a published event', async () => {
  const component = await readFile(new URL('../src/components/HomeMedia.astro', import.meta.url), 'utf8');
  const selected = [...component.match(/const selected = \[([\s\S]*?)\];/)![1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.equal(new Set(selected).size, 20);
  for (const id of ['group-portraits-image-118', 'community-meals-image-110', 'beach-volleyball-2018-recap',
    'costume-and-karaoke-image-085', 'welcome-2023-photo-002', 'yalda-2018-kamyar-performance',
    'nowruz-celebrations-image-022', 'poetry-night-2019-photo']) assert.ok(selected.includes(id), id);
  const items = selected.map(id => publicMedia.find(item => item.id === id)!);
  assert.equal(items.filter(item => item.kind === 'video').length, 8);
  for (const item of items) {
    assert.ok(item && (item.kind === 'photo' || item.kind === 'video'));
    assert.ok(item.caption.en && item.caption.fa, item.id);
    assert.ok(events.some(event => event.id === item.eventId && isPublicEvent(event)), item.id);
  }
});
