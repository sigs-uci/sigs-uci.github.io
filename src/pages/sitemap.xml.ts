import { pages } from '../lib/routes';
import { events, stories } from '../data';
import { isPublicEvent } from '../lib/events';
import { isPublicStory, availableLocales } from '../lib/publication';
import { site, href } from '../config/site';

export function GET() {
  const routes = [...pages.filter(page => !['search', 'languages'].includes(page.path)).map(page => page.path),
    ...events.filter(isPublicEvent).map(event => `events/${event.slug}`),
    ...stories.filter(story => isPublicStory(story)).map(story => `community/stories/${story.slug}`)];
  const entries = [...new Set(routes)].flatMap(route => {
    const languages = availableLocales(route);
    const alternate = languages.map(locale => `<xhtml:link rel="alternate" hreflang="${locale}" href="${site.origin}${href(locale, route)}"/>`).join('');
    const fallback = languages.includes('en') ? `<xhtml:link rel="alternate" hreflang="x-default" href="${site.origin}${href('en', route)}"/>` : '';
    return languages.map(locale => `<url><loc>${site.origin}${href(locale, route)}</loc>${alternate}${fallback}</url>`);
  });
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
