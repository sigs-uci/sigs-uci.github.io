import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLocalizedPages, validateSearchLanguages } from '../scripts/lib/localization-output.mjs';

const origin = 'https://sigs-uci.github.io';
function page(locale: 'en' | 'fa', route = '', counterparts = ['en', 'fa']): string {
  const url = (language: string) => `${origin}/${language}/${route ? `${route}/` : ''}`;
  return `<html lang="${locale}" dir="${locale === 'fa' ? 'rtl' : 'ltr'}"><head>
    <title>${locale === 'fa' ? 'رویدادهای سیگس' : 'SIGS events'}</title>
    <meta name="description" content="${locale === 'fa' ? 'دورهمی‌های دانشجویان' : 'Student gatherings'}">
    <meta property="og:locale" content="${locale === 'fa' ? 'fa_IR' : 'en_US'}">
    ${counterparts.filter(language => language !== locale).map(language => `<meta property="og:locale:alternate" content="${language === 'fa' ? 'fa_IR' : 'en_US'}">`).join('')}
    <link rel="canonical" href="${url(locale)}">
    ${counterparts.map(language => `<link rel="alternate" hreflang="${language}" href="${url(language)}">`).join('')}
    ${counterparts.includes('en') ? `<link rel="alternate" hreflang="x-default" href="${url('en')}">` : ''}
    </head><body><main><h1>${locale === 'fa' ? 'رویدادها' : 'Events'}</h1></main></body></html>`;
}

test('published counterparts share routes and use reciprocal language and social metadata', () => {
  const pages = new Map([
    ['en/index.html', page('en')], ['fa/index.html', page('fa')],
    ['en/events/nowruz/index.html', page('en', 'events/nowruz')],
    ['fa/events/nowruz/index.html', page('fa', 'events/nowruz')],
    ['en/community/stories/example/index.html', page('en', 'community/stories/example', ['en'])],
  ]);
  assert.deepEqual(validateLocalizedPages(pages, origin, ['', 'events/nowruz']), []);
  pages.delete('fa/events/nowruz/index.html');
  const errors = validateLocalizedPages(pages, origin, ['', 'events/nowruz']);
  assert.ok(errors.some(error => error.includes('missing language counterpart')));
  assert.ok(errors.some(error => error.startsWith('en/events/nowruz/') && error.includes('actual matching pages')));
});

test('a Persian route cannot pass with English language, direction or content signals', () => {
  const pages = new Map([['en/index.html', page('en')], ['fa/index.html', page('en')]]);
  const errors = validateLocalizedPages(pages, origin, ['']);
  for (const issue of ['language does not match', 'incorrect reading direction', 'canonical URL', 'incorrect social language', 'Persian title, description and main']) {
    assert.ok(errors.some(error => error.includes(issue)), issue);
  }
});

test('hreflang cannot silently switch an event to the other language homepage', () => {
  const route = 'events/nowruz';
  const english = page('en', route).replace(`hreflang="fa" href="${origin}/fa/${route}/"`, `hreflang="fa" href="${origin}/fa/"`);
  const pages = new Map([['en/events/nowruz/index.html', english], ['fa/events/nowruz/index.html', page('fa', route)]]);
  assert.ok(validateLocalizedPages(pages, origin, [route]).some(error => error.includes('actual matching pages')));
});

test('search output must include usable English and Persian indexes without an accidental unknown language', () => {
  assert.deepEqual(validateSearchLanguages({ languages: { en: { page_count: 52 }, fa: { page_count: 52 } } }, ['en', 'fa']), []);
  assert.ok(validateSearchLanguages({ languages: { en: { page_count: 52 } } }, ['en', 'fa']).some(error => error.includes('missing fa')));
  assert.ok(validateSearchLanguages({ languages: { en: { page_count: 52 }, fa: { page_count: 0 } } }, ['en', 'fa']).some(error => error.includes('missing fa')));
  assert.ok(validateSearchLanguages({ languages: { en: { page_count: 52 }, fa: { page_count: 52 }, unknown: { page_count: 1 } } }, ['en', 'fa']).some(error => error.includes('Unexpected search language')));
});
