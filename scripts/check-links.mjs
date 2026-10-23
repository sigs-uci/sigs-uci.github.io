import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve(process.argv[2] ?? 'dist');
const origin = 'https://sigs-uci.github.io';
const problems = [];
const pages = new Map();

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (entry.isFile() && entry.name.endsWith('.html')) pages.set(filename, await readFile(filename, 'utf8'));
  }
}

function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

async function targetFile(pathname) {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  const filename = path.resolve(output, relative);
  if (!filename.startsWith(output + path.sep) && filename !== output) return null;
  try {
    const info = await stat(filename);
    return info.isDirectory() ? path.join(filename, 'index.html') : filename;
  } catch {
    return null;
  }
}

await walk(output);
for (const [filename, html] of pages) {
  const relative = path.relative(output, filename).split(path.sep).join('/');
  const route = relative.endsWith('index.html') ? relative.slice(0, -10) : relative;
  const base = new URL('/' + route, origin);
  for (const match of html.matchAll(/\b(href|src|poster)\s*=\s*["']([^"']*)["']/gi)) {
    const value = decode(match[2]);
    if (!value || value === '#') {
      problems.push(`${relative}: empty ${match[1]}`);
      continue;
    }
    if (/^(?:mailto:|tel:|data:|blob:)/i.test(value)) continue;
    let url;
    try { url = new URL(value, base); } catch { problems.push(`${relative}: invalid URL`); continue; }
    if (url.origin !== origin) continue;
    const target = await targetFile(url.pathname);
    if (!target) { problems.push(`${relative}: missing ${url.pathname}`); continue; }
    try { await stat(target); } catch { problems.push(`${relative}: missing ${url.pathname}`); continue; }
    if (url.hash && target.endsWith('.html')) {
      const content = pages.get(target) ?? await readFile(target, 'utf8');
      const anchors = [...content.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/g)].map((item) => decode(item[1]));
      if (!anchors.includes(decodeURIComponent(url.hash.slice(1)))) problems.push(`${relative}: missing anchor ${url.pathname}${url.hash}`);
    }
  }
}
if (problems.length) {
  for (const problem of problems.slice(0, 40)) console.error(problem);
  console.error(`${problems.length} link problems`);
  process.exitCode = 1;
} else console.log(`Checked links in ${pages.size} HTML pages`);
