import test from 'node:test';
import assert from 'node:assert/strict';
import { media } from '../src/data';
import { displayMediaCredit } from '../src/lib/media-credit';

test('unknown creators and archive maintenance notes are omitted from displayed credits', () => {
  for (const credit of [
    'Photographer not recorded.',
    'Videographer not recorded.',
    'Designer not recorded.',
    'Design credit not recorded.',
    'SIGS event archive.',
    'SIGS event artwork. Artist not recorded.',
    'Promotional portrait shared by SIGS. Photographer not recorded.',
    'Film and student-group promotional artwork. Drawing credit retained in artwork.',
  ]) {
    assert.equal(displayMediaCredit(credit, 'en'), undefined, credit);
    assert.equal(displayMediaCredit(credit, 'fa'), undefined, credit);
  }
});

test('named photographers, studios and artwork signatures remain in both languages', () => {
  assert.equal(displayMediaCredit('Mojgan Salehi & Pegah Pouladian.', 'en'), 'Mojgan Salehi & Pegah Pouladian.');
  assert.equal(displayMediaCredit('Mojgan Salehi & Pegah Pouladian.', 'fa'), 'Mojgan Salehi و Pegah Pouladian.');
  for (const locale of ['en', 'fa'] as const) {
    assert.equal(displayMediaCredit('BLUEYE STUDIO (visible watermark).', locale), 'BLUEYE STUDIO');
    assert.equal(displayMediaCredit('PegioR (visible watermark).', locale), 'PegioR');
    assert.equal(displayMediaCredit('Artwork signed ©saman.', locale), '©saman');
    assert.equal(displayMediaCredit('Artwork signed KD STUDIO; SIGS program.', locale), 'KD STUDIO');
    assert.ok(displayMediaCredit('Pol Media; video and editing by Arian Khoroushi.', locale)?.includes('Arian Khoroushi'));
  }
});

test('required source attribution and sponsor roles survive removal of process wording', () => {
  const google = media.find(item => item.id === 'posters-and-venues-image-015')!;
  const freepik = media.find(item => item.id === 'halloween-2023-poster')!;
  const ags = media.find(item => item.id === 'nowruz-2014-invitation')!;
  for (const locale of ['en', 'fa'] as const) {
    assert.equal(displayMediaCredit(google.credit, locale), 'Google Street View');
    assert.equal(displayMediaCredit(freepik.credit, locale), 'Freepik');
  }
  assert.equal(displayMediaCredit(ags.credit, 'en'), 'Sponsored by AGS.');
  assert.equal(displayMediaCredit(ags.credit, 'fa'), 'با حمایت AGS.');
});

test('multi-party poster attributions keep every named institution', () => {
  const credit = 'SIGS, ISU and Shemroon Entertainment promotional artwork. Artist not recorded.';
  for (const locale of ['en', 'fa'] as const) {
    const displayed = displayMediaCredit(credit, locale)!;
    for (const name of ['SIGS', 'ISU', 'Shemroon Entertainment']) assert.ok(displayed.includes(name));
    assert.doesNotMatch(displayed, /not recorded/i);
  }
});

test('an unrecognized future credit passes through without guessing or deleting a creator', () => {
  for (const credit of ['Future Studio', 'New Archive Studio (visible watermark).', 'A new photographer; artist not recorded.']) {
    assert.equal(displayMediaCredit(credit, 'en'), credit);
    assert.equal(displayMediaCredit(credit, 'fa'), credit);
  }
});

test('current public media credits show no remaining review notes', () => {
  for (const item of media.filter(item => item.publication === 'published' && item.rights === 'approved')) {
    for (const locale of ['en', 'fa'] as const) {
      const displayed = displayMediaCredit(item.credit, locale);
      if (displayed) assert.doesNotMatch(displayed, /not recorded|visible watermark|mark visible|credit retained|logos retained|آرشیو برنامه|ثبت نشده|حفظ شده|نشان روی تصویر/i, item.id);
    }
  }
});
