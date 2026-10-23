import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validateLocalizedPages, validateSearchLanguages } from './lib/localization-output.mjs';

const output = path.resolve(process.argv[2] ?? 'dist');
const errors = [];
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    const info = await lstat(filename);
    if (info.isSymbolicLink()) errors.push('Output contains a symbolic link');
    else if (info.isDirectory()) await walk(filename);
    else files.push(filename);
  }
}
await walk(output);
let pages = 0;
let eventPages = 0;
const htmlPages = new Map();
const searchable = { en: 0, fa: 0 };
for (const filename of files) {
  const relative = path.relative(output, filename).split(path.sep).join('/');
  if (/(?:^|\/)(?:node_modules|\.git|tests|scripts)(?:\/|$)|\.map$|\.(?:ts|astro|zip)$/i.test(relative)) errors.push(`Unexpected output file: ${relative}`);
  if (!filename.endsWith('.html')) continue;
  pages++;
  const html = await readFile(filename, 'utf8');
  htmlPages.set(relative, html);
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) errors.push(`${relative}: missing language`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${relative}: missing title`);
  if (!/<link\b[^>]*rel=["']canonical["']/i.test(html)) errors.push(`${relative}: missing canonical URL`);
  if (!/<meta\b[^>]*name=["']description["']/i.test(html)) errors.push(`${relative}: missing description`);
  if (/(?:href|src)=["'](?:#|)["']/.test(html)) errors.push(`${relative}: placeholder action`);
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${relative}: invalid structured data`); }
  }
  if (/^en\/events\/[^/]+\/index\.html$/.test(relative) && !relative.includes('/archive/')) eventPages++;
  if (html.includes('data-pagefind-body')) {
    if (relative === 'index.html' || /(?:^|\/)(?:search|languages|404)(?:\/|\.)/.test(relative)) errors.push(`${relative}: utility page is searchable`);
    const locale = /^(en|fa)\//.exec(relative)?.[1];
    if (locale) searchable[locale]++;
  }
}
if (eventPages < 20) errors.push('Historical event pages are missing');
const [events, translations, stories, organization] = await Promise.all(['events', 'eventTranslations', 'stories', 'organization'].map(async name =>
  JSON.parse(await readFile(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))));
const requiredPairs = [...htmlPages.keys()].filter(filename => filename.startsWith('en/') && !filename.startsWith('en/community/stories/'))
  .map(filename => filename.slice(3).replace(/(?:\/)?index\.html$/, ''));
errors.push(...validateLocalizedPages(htmlPages, organization.origin, requiredPairs));
for (const event of events) {
  const published = event.publication === 'published' && ['edited', 'reviewed'].includes(event.editorial.en);
  const revision = createHash('sha256').update(JSON.stringify({ title: event.title, summary: event.summary })).digest('hex');
  const translation = translations.find(record => record.eventId === event.id && record.locale === 'fa' && record.status === 'reviewed'
    && record.reviewedOn && record.sourceRevision === revision && record.title.trim() && record.summary.trim());
  if (published && !translation) errors.push(`Published event needs a current Persian translation: ${event.slug}`);
  for (const locale of ['en', 'fa']) {
    const expected = published && (locale === 'en' || Boolean(translation));
    if (expected !== htmlPages.has(`${locale}/events/${event.slug}/index.html`)) errors.push(`Event publication does not match its ${locale} route: ${event.slug}`);
  }
}
for (const [filename] of htmlPages) {
  const event = /^(?:en|fa)\/events\/([^/]+)\/index\.html$/.exec(filename)?.[1];
  if (event && event !== 'archive' && !events.some(record => record.slug === event)) errors.push(`Unknown event route: ${filename}`);
  const story = /^(en|fa)\/community\/stories\/([^/]+)\/index\.html$/.exec(filename);
  if (story && !stories.some(record => record.locale === story[1] && record.slug === story[2] && record.publication === 'published' && record.editorial === 'reviewed')) errors.push(`Unpublished story route: ${filename}`);
}
try {
  const entry = JSON.parse(await readFile(path.join(output, 'pagefind', 'pagefind-entry.json'), 'utf8'));
  errors.push(...validateSearchLanguages(entry, ['en', 'fa']));
  for (const locale of ['en', 'fa']) {
    if (entry.languages?.[locale]?.page_count !== searchable[locale]) errors.push(`Search index does not contain every searchable ${locale} page`);
  }
} catch { errors.push('Search language manifest is missing or unreadable'); }
const sitemapFiles = files.filter(filename => /sitemap.*\.xml$/.test(filename));
if (!sitemapFiles.length) errors.push('Sitemap is missing');
else {
  const sitemaps = await Promise.all(sitemapFiles.map(filename => readFile(filename, 'utf8')));
  const locations = new Set(sitemaps.flatMap(xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])));
  for (const [filename, html] of htmlPages) {
    if (!/^(?:en|fa)\//.test(filename) || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
    const url = new URL('/' + filename.replace(/index\.html$/, ''), organization.origin).href;
    if (!locations.has(url)) errors.push(`${filename}: published page is missing from sitemap`);
  }
}
if (!files.some((filename) => path.basename(filename) === '404.html')) errors.push('404 page is missing');
if (errors.length) {
  for (const error of [...new Set(errors)].slice(0, 40)) console.error(error);
  process.exitCode = 1;
} else console.log(`Checked ${files.length} output files and ${pages} pages`);
