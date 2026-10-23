const locales = ['en', 'fa'];
const persianText = /[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/u;

/** @param {string} tag */
function attributes(tag) {
  const result = new Map();
  for (const match of tag.matchAll(/\s([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]);
  }
  return result;
}

/**
 * Check the language signals consumed by browsers, assistive technology and search engines.
 * Paths are relative output filenames; requiredPairs contains shared route paths without a locale.
 * @param {ReadonlyMap<string, string>} pages
 * @param {string} origin
 * @param {readonly string[]} requiredPairs
 * @returns {string[]}
 */
export function validateLocalizedPages(pages, origin, requiredPairs) {
  const errors = [];
  const filenameFor = (locale, route) => `${locale}/${route ? `${route}/` : ''}index.html`;
  for (const route of requiredPairs) {
    for (const locale of locales) {
      const filename = filenameFor(locale, route);
      if (!pages.has(filename)) errors.push(`${filename}: missing language counterpart`);
    }
  }
  for (const [filename, html] of pages) {
    const match = /^(en|fa)\/(.*)index\.html$/.exec(filename);
    if (!match) continue;
    const locale = match[1];
    const route = match[2].replace(/\/$/, '');
    const htmlTag = attributes(html.match(/<html\b[^>]*>/i)?.[0] ?? '');
    if (htmlTag.get('lang') !== locale) errors.push(`${filename}: language does not match its route`);
    if (htmlTag.get('dir') !== (locale === 'fa' ? 'rtl' : 'ltr')) errors.push(`${filename}: incorrect reading direction`);
    if ((html.match(/<h1(?:\s|>)/gi) ?? []).length !== 1) errors.push(`${filename}: expected one main heading`);
    const urlFor = (language) => new URL(`/${language}/${route ? `${route}/` : ''}`, origin).href;
    const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(value => attributes(value[0]));
    const canonical = links.filter(link => link.get('rel') === 'canonical');
    if (canonical.length !== 1 || canonical[0].get('href') !== urlFor(locale)) errors.push(`${filename}: canonical URL does not match its route`);
    const counterparts = locales.filter(language => pages.has(filenameFor(language, route)));
    const alternates = links.filter(link => link.get('rel') === 'alternate' && link.has('hreflang'));
    const expected = [...counterparts, ...(counterparts.includes('en') ? ['x-default'] : [])];
    if (alternates.length !== expected.length || expected.some(language =>
      alternates.filter(link => link.get('hreflang') === language && link.get('href') === urlFor(language === 'x-default' ? 'en' : language)).length !== 1)) {
      errors.push(`${filename}: language alternates must point to actual matching pages`);
    }
    const metadata = [...html.matchAll(/<meta\b[^>]*>/gi)].map(value => attributes(value[0]));
    if (metadata.find(meta => meta.get('property') === 'og:locale')?.get('content') !== (locale === 'fa' ? 'fa_IR' : 'en_US')) {
      errors.push(`${filename}: incorrect social language metadata`);
    }
    const socialAlternates = metadata.filter(meta => meta.get('property') === 'og:locale:alternate').map(meta => meta.get('content'));
    const expectedSocial = counterparts.filter(language => language !== locale).map(language => language === 'fa' ? 'fa_IR' : 'en_US');
    if (socialAlternates.length !== expectedSocial.length || expectedSocial.some(language => !socialAlternates.includes(language))) {
      errors.push(`${filename}: social language alternates do not match published counterparts`);
    }
    if (locale === 'fa') {
      const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '';
      const description = metadata.find(meta => meta.get('name') === 'description')?.get('content') ?? '';
      const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1].replace(/<[^>]*>/g, ' ') ?? '';
      if (!persianText.test(title) || !persianText.test(description) || !persianText.test(main)) errors.push(`${filename}: Persian title, description and main content are required`);
    }
  }
  return errors;
}

/** @param {unknown} entry @param {readonly string[]} expectedLocales @returns {string[]} */
export function validateSearchLanguages(entry, expectedLocales) {
  const languages = entry && typeof entry === 'object' && 'languages' in entry ? entry.languages : null;
  if (!languages || typeof languages !== 'object') return ['Search language manifest is invalid'];
  const errors = [];
  for (const locale of expectedLocales) {
    const index = languages[locale];
    if (!index || typeof index !== 'object' || !Number.isInteger(index.page_count) || index.page_count < 1) errors.push(`Search index is missing ${locale} pages`);
  }
  for (const locale of Object.keys(languages)) {
    if (!expectedLocales.includes(locale)) errors.push(`Unexpected search language: ${locale}`);
  }
  return errors;
}
