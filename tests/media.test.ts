import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { media } from '../src/data';

async function inspectAsset(src: string) {
  const root = path.resolve('public');
  const filename = path.resolve(root, src.replace(/^\//, ''));
  assert.ok(filename.startsWith(root + path.sep));
  assert.equal((await lstat(filename)).isSymbolicLink(), false);
  const bytes = await readFile(filename);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const chunk = bytes.toString('ascii', offset, offset + 4);
    assert.equal(['EXIF', 'XMP '].includes(chunk), false, `${src}: unexpected metadata chunk`);
    const size = bytes.readUInt32LE(offset + 4);
    offset += 8 + size + size % 2;
    assert.ok(offset <= bytes.length);
  }
  return imageMetadata(bytes, src);
}

test('published image records match metadata-free public derivatives and smaller thumbnails', async () => {
  for (const image of media) {
    const full = await inspectAsset(image.src);
    assert.equal(full.width, image.width);
    assert.equal(full.height, image.height);
    assert.ok(image.thumbnail);
    const thumbnail = await inspectAsset(image.thumbnail!);
    assert.ok(thumbnail.width < full.width);
    assert.ok(thumbnail.height < full.height);
    assert.ok(Math.abs(thumbnail.width / thumbnail.height - full.width / full.height) < 0.01);
  }
});
