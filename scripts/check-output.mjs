import { readFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';

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
for (const filename of files) {
  const relative = path.relative(output, filename).split(path.sep).join('/');
  if (/(?:^|\/)(?:node_modules|\.git|tests|scripts)(?:\/|$)|\.map$|\.(?:ts|astro|zip)$/i.test(relative)) errors.push(`Unexpected output file: ${relative}`);
  if (/^fa(?:\/|$)/.test(relative)) errors.push('Persian publication needs approved translations');
  if (!filename.endsWith('.html')) continue;
  pages++;
  const html = await readFile(filename, 'utf8');
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) errors.push(`${relative}: missing language`);
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${relative}: missing title`);
  if (!/<link\b[^>]*rel=["']canonical["']/i.test(html)) errors.push(`${relative}: missing canonical URL`);
  if (!/<meta\b[^>]*name=["']description["']/i.test(html)) errors.push(`${relative}: missing description`);
  if (relative.startsWith('en/') && (html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) errors.push(`${relative}: expected one main heading`);
  if (/(?:href|src)=["'](?:#|)["']/.test(html)) errors.push(`${relative}: placeholder action`);
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); } catch { errors.push(`${relative}: invalid structured data`); }
  }
  if (/^en\/events\/[^/]+\/index\.html$/.test(relative) && !relative.includes('/archive/')) eventPages++;
  if (html.includes('data-pagefind-body') && (relative === 'index.html' || /(?:^|\/)(?:search|404)(?:\/|\.)/.test(relative))) errors.push(`${relative}: utility page is searchable`);
}
if (eventPages < 20) errors.push('Historical event pages are missing');
const events = JSON.parse(await readFile(new URL('../src/data/events.json', import.meta.url), 'utf8'));
for (const event of events) {
  const route = path.join(output, 'en', 'events', event.slug, 'index.html');
  const published = event.publication === 'published' && ['edited', 'reviewed'].includes(event.editorial.en);
  if (published !== files.includes(route)) errors.push(`Event publication does not match its route: ${event.slug}`);
}
if (!files.some((filename) => path.relative(output, filename).startsWith('pagefind' + path.sep))) errors.push('Search index is missing');
if (!files.some((filename) => /sitemap.*\.xml$/.test(filename))) errors.push('Sitemap is missing');
if (!files.some((filename) => path.basename(filename) === '404.html')) errors.push('404 page is missing');
if (errors.length) {
  for (const error of [...new Set(errors)].slice(0, 40)) console.error(error);
  process.exitCode = 1;
} else console.log(`Checked ${files.length} output files and ${pages} pages`);
