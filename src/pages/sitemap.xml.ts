import { pages } from '../lib/routes';
import { events, stories } from '../data';
import { isPublicEvent } from '../lib/events';
import { isPublicStory, availableLocales } from '../lib/publication';
import { site, href } from '../config/site';

export function GET() {
  const routes = [...pages.filter(page => !['search', 'languages'].includes(page.path)).map(page => page.path),
    ...events.filter(isPublicEvent).map(event => `events/${event.slug}`),
    ...stories.filter(story => isPublicStory(story)).map(story => `community/stories/${story.slug}`)];
  const paths = [...new Set(routes.flatMap(route => availableLocales(route).map(locale => href(locale, route))))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${site.origin}${path}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml' } });
}
