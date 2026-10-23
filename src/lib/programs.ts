import { href, type Locale } from '../config/site';
import type { ProgramRelatedLink } from '../data/schema';

export function programLinkHref(link: ProgramRelatedLink, locale: Locale): string {
  const path = href(locale, link.path);
  const query = new URLSearchParams();
  if (link.query?.period) query.set('period', link.query.period);
  if (link.query?.category) query.set('category', link.query.category);
  return query.size ? `${path}?${query}` : path;
}
