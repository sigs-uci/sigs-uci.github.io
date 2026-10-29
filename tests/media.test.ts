import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { imageMetadata } from 'astro/assets/utils';
import { data, media, validatePublicData, type MediaRecord } from '../src/data';

async function assetBytes(src: string) {
  const root = path.resolve('public');
  const filename = path.resolve(root, src.replace(/^\//, ''));
  assert.ok(filename.startsWith(root + path.sep));
  assert.equal((await lstat(filename)).isSymbolicLink(), false);
  assert.ok((await realpath(filename)).startsWith(root + path.sep));
  return readFile(filename);
}

async function inspectAsset(src: string) {
  const bytes = await assetBytes(src);
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const chunk = bytes.toString('ascii', offset, offset + 4);
    assert.equal(['EXIF', 'XMP ', 'IPTC'].includes(chunk), false, `${src}: unexpected metadata chunk`);
    const size = bytes.readUInt32LE(offset + 4);
    offset += 8 + size + size % 2;
    assert.ok(offset <= bytes.length);
  }
  return imageMetadata(bytes, src);
}

test('published image records match metadata-free public derivatives and smaller thumbnails', async () => {
  for (const image of media.filter(item => item.publication === 'published' && item.rights === 'approved' && item.kind !== 'video')) {
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

type Box = { type: string; body: number; end: number };
function boxes(bytes: Buffer, start = 0, end = bytes.length): Box[] {
  const result: Box[] = [];
  for (let offset = start; offset < end;) {
    assert.ok(offset + 8 <= end, 'MP4 box header is truncated');
    let size = bytes.readUInt32BE(offset);
    let header = 8;
    if (size === 1) { assert.ok(offset + 16 <= end); size = Number(bytes.readBigUInt64BE(offset + 8)); header = 16; }
    if (size === 0) size = end - offset;
    assert.ok(Number.isSafeInteger(size) && size >= header && offset + size <= end, 'MP4 box size is invalid');
    result.push({ type: bytes.toString('ascii', offset + 4, offset + 8), body: offset + header, end: offset + size });
    offset += size;
  }
  return result;
}

function inspectVideo(bytes: Buffer) {
  const roots = boxes(bytes);
  assert.ok(roots.some(box => box.type === 'ftyp'), 'MP4 file type is required');
  const moov = roots.find(box => box.type === 'moov')!;
  const mdat = roots.find(box => box.type === 'mdat')!;
  assert.ok(moov && mdat && moov.body < mdat.body, 'Video metadata must precede media for progressive playback');
  const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf']);
  function checkEmptyMetadata(box: Box) {
    if (box.type === 'udta') {
      for (const child of boxes(bytes, box.body, box.end)) {
        assert.equal(child.type, 'meta', 'Video user data must not contain original metadata');
        checkEmptyMetadata(child);
      }
    } else {
      assert.ok(box.body + 4 <= box.end);
      for (const child of boxes(bytes, box.body + 4, box.end)) {
        assert.ok(['hdlr', 'ilst'].includes(child.type), 'Video metadata must not contain tags');
        if (child.type === 'ilst') assert.equal(child.body, child.end, 'Video metadata tag list must be empty');
        else assert.ok([...bytes.subarray(child.body + 24, child.end)].every(value => value === 0), 'Video metadata handler must not retain a name');
      }
    }
  }
  function checkMetadata(items: Box[]) {
    for (const box of items) {
      assert.equal(['uuid', 'XMP_', 'xml ', 'loci'].includes(box.type), false, 'Video must not retain original metadata');
      if (['udta', 'meta'].includes(box.type)) checkEmptyMetadata(box);
      if (['mvhd', 'tkhd', 'mdhd'].includes(box.type)) {
        const version = bytes[box.body];
        assert.ok(version === 0 || version === 1);
        const created = version === 1 ? bytes.readBigUInt64BE(box.body + 4) : BigInt(bytes.readUInt32BE(box.body + 4));
        const modified = version === 1 ? bytes.readBigUInt64BE(box.body + 12) : BigInt(bytes.readUInt32BE(box.body + 8));
        assert.equal(created, 0n, 'Original video creation dates must be cleared');
        assert.equal(modified, 0n, 'Original video modification dates must be cleared');
      }
      if (containers.has(box.type)) checkMetadata(boxes(bytes, box.body, box.end));
    }
  }
  checkMetadata(roots);
  const children = boxes(bytes, moov.body, moov.end);
  const movie = children.find(box => box.type === 'mvhd')!;
  assert.ok(movie, 'Video movie header is required');
  const version = bytes[movie.body];
  const timescale = bytes.readUInt32BE(movie.body + (version === 1 ? 20 : 12));
  const duration = version === 1 ? Number(bytes.readBigUInt64BE(movie.body + 24)) : bytes.readUInt32BE(movie.body + 16);
  assert.ok(timescale > 0 && duration > 0);
  let videoDimensions: { width: number; height: number } | undefined;
  let audioTracks = 0;
  for (const track of children.filter(box => box.type === 'trak')) {
    const trackBoxes = boxes(bytes, track.body, track.end);
    const mdia = trackBoxes.find(box => box.type === 'mdia')!;
    if (!mdia) continue;
    const handler = boxes(bytes, mdia.body, mdia.end).find(box => box.type === 'hdlr');
    if (!handler) continue;
    const kind = bytes.toString('ascii', handler.body + 8, handler.body + 12);
    if (kind === 'soun') audioTracks++;
    if (kind !== 'vide') continue;
    const header = trackBoxes.find(box => box.type === 'tkhd')!;
    assert.ok(header, 'Video track header is required');
    videoDimensions = { width: bytes.readUInt32BE(header.end - 8) / 65536, height: bytes.readUInt32BE(header.end - 4) / 65536 };
  }
  assert.ok(videoDimensions, 'A playable video track is required');
  return { ...videoDimensions, duration: duration / timescale, audioTracks };
}

function cueSeconds(value: string): number {
  return value.split(':').map(Number).reduce((total, part) => total * 60 + part, 0);
}

test('published videos have stripped MP4 derivatives, matching posters and timed text within their duration', async () => {
  for (const video of media.filter(item => item.publication === 'published' && item.rights === 'approved' && item.kind === 'video')) {
    const actual = inspectVideo(await assetBytes(video.src));
    assert.equal(actual.width, video.width, video.id);
    assert.equal(actual.height, video.height, video.id);
    assert.ok(Math.abs(actual.duration - video.duration!) < 0.25, `${video.id}: duration must match the public video`);
    assert.equal(actual.audioTracks > 0, video.audioContent !== 'silent', `${video.id}: audio classification must match the real MP4 soundtrack`);
    const poster = await inspectAsset(video.videoPoster!);
    assert.ok(Math.abs(poster.width / poster.height - video.width / video.height) < 0.01, video.id);
    if (video.thumbnail) await inspectAsset(video.thumbnail);
    for (const filename of Object.values(video.captions ?? {})) {
      const text = (await assetBytes(filename)).toString('utf8').replace(/^\uFEFF/, '');
      assert.match(text, /^WEBVTT(?:[ \t].*)?\r?\n/);
      const cues = [...text.matchAll(/^((?:\d{2}:)?\d{2}:\d{2}\.\d{3})[ \t]+-->[ \t]+((?:\d{2}:)?\d{2}:\d{2}\.\d{3})[^\r\n]*\r?\n([^\r\n]+)/gm)];
      assert.ok(cues.length > 0, `${filename}: caption text and timing are required`);
      for (const cue of cues) {
        assert.ok(cueSeconds(cue[2]) > cueSeconds(cue[1]), filename);
        assert.ok(cueSeconds(cue[2]) <= video.duration! + 0.25, filename);
        assert.ok(cue[3].trim(), filename);
      }
    }
  }
});

test('video inspection rejects added user metadata even when the video itself remains intact', async () => {
  const video = media.find(item => item.publication === 'published' && item.kind === 'video');
  if (!video) return;
  const bytes = await assetBytes(video.src);
  const box = (type: string, payload: Buffer) => {
    const header = Buffer.alloc(8);
    header.writeUInt32BE(payload.length + 8);
    header.write(type, 4, 'latin1');
    return Buffer.concat([header, payload]);
  };
  assert.throws(() => inspectVideo(Buffer.concat([bytes, box('uuid', Buffer.alloc(16))])), /original metadata/);
  assert.throws(() => inspectVideo(Buffer.concat([bytes, box('udta', box('name', Buffer.from('An isolated metadata fixture')))])), /original metadata/);
});

function videoFixture(): MediaRecord {
  return { id: 'test-video', src: '/media/test-video.mp4', kind: 'video', width: 720, height: 1280,
    eventId: null, focalPoint: [0.5, 0.5], alt: { en: 'Video fixture', fa: 'ویدیوی آزمایشی' },
    caption: { en: 'An isolated clip.', fa: 'کلیپ آزمایشی.' }, credit: 'Test fixture', publication: 'published', rights: 'approved',
    videoPoster: '/media/test-video-poster.webp', duration: 12.5, audioContent: 'ambient',
    transcript: { en: 'A test scene with ambient sound.', fa: 'صحنهٔ آزمایشی با صدای محیط.' } };
}

test('video publication requires permissions, a poster, real duration and bilingual descriptive alternatives', () => {
  const check = (change: Partial<MediaRecord>) => {
    const copy = structuredClone(data);
    copy.media.push({ ...videoFixture(), ...change });
    return validatePublicData(copy).filter(error => error.startsWith('media.test-video:'));
  };
  assert.deepEqual(check({}), []);
  for (const change of [{ rights: 'pending' as const }, { videoPoster: undefined }, { duration: undefined }, { duration: 0 },
    { duration: Infinity }, { audioContent: undefined }, { transcript: { en: 'Only one language' } }, { transcript: { en: ' ', fa: 'متن' } }]) assert.ok(check(change).length > 0, JSON.stringify(change));
  assert.ok(check({ audioContent: 'speech' }).some(error => error.includes('timed captions')));
  assert.deepEqual(check({ audioContent: 'speech', captions: { en: '/media/test-en.vtt', fa: '/media/test-fa.vtt' } }), []);
  assert.ok(check({ audioContent: 'speech', captions: { en: '/media/test-en.vtt' } }).length > 0);
  assert.ok(check({ audioNote: { en: 'The original has a gap in its sound.' } }).some(error => error.includes('Audio notes')));
  assert.deepEqual(check({ audioNote: { en: 'The original has a gap in its sound.', fa: 'صدای نسخهٔ اصلی در بخشی از فیلم قطع است.' } }), []);
});

test('published photos, posters and videos require both languages for alternative text and captions', () => {
  assert.deepEqual(validatePublicData(data), []);
  for (const kind of ['photo', 'poster', 'video']) {
    const source = media.find(item => item.kind === kind && item.publication === 'published')!;
    assert.ok(source, kind);
    for (const field of ['alt', 'caption'] as const) for (const locale of ['en', 'fa'] as const) {
      for (const value of [undefined, '   ']) {
        const copy = structuredClone(data);
        const record = copy.media.find(item => item.id === source.id)!;
        if (value === undefined) delete record[field][locale];
        else record[field][locale] = value;
        const expected = field === 'alt' ? 'English and Persian alternative text' : 'English and Persian captions';
        assert.ok(validatePublicData(copy).some(error => error.startsWith(`media.${source.id}:`) && error.includes(expected)), `${kind}: ${field}.${locale}`);
      }
    }
  }
  const copy = structuredClone(data);
  const draft = { ...videoFixture(), publication: 'draft' as const, alt: { en: 'Draft alternative text' }, caption: { en: 'Draft caption' } };
  copy.media.push(draft);
  assert.deepEqual(validatePublicData(copy), []);
});

test('media paths reject remote originals, traversal and mismatched derivative types', () => {
  for (const change of [{ src: 'https://example.com/original.mp4' }, { src: '/media/../original.mp4' },
    { src: '/media/%2e%2e/original.mp4' }, { src: '/media/test-video.mov' }, { videoPoster: '//example.com/poster.webp' },
    { captions: { en: '/media/test-en.srt' } }, { captions: { en: '/media/../test.vtt' } }]) {
    const copy = structuredClone(data);
    copy.media.push({ ...videoFixture(), ...change });
    assert.ok(validatePublicData(copy).some(error => error.startsWith('media.test-video:')), JSON.stringify(change));
  }
  const copy = structuredClone(data);
  Object.assign(copy.media[0], { audioContent: 'music' });
  assert.ok(validatePublicData(copy).some(error => error.includes('Video fields belong')));
  const brokenId = structuredClone(data);
  brokenId.media.push({ ...videoFixture(), id: 'video with spaces' });
  assert.ok(validatePublicData(brokenId).some(error => error.includes('Media IDs must')));
});

test('a video cannot become a broken image hero or team portrait', () => {
  const copy = structuredClone(data);
  copy.media.push(videoFixture());
  copy.events[0].heroImage = 'test-video';
  copy.people[0].portrait = 'test-video';
  copy.boardTerms[0].people[0].portrait = 'test-video';
  const errors = validatePublicData(copy);
  assert.ok(errors.some(error => error.includes('Hero image must reference an image')));
  assert.ok(errors.some(error => error.startsWith('people.') && error.includes('published images')));
  assert.ok(errors.some(error => error.startsWith('boardTerms.') && error.includes('published images')));
});
