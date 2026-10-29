import type { EventRecord, MediaRecord } from '../data';
import { site, href, type Locale } from '../config/site';
import { isPublicEvent } from './events';

export const organizationMetadata = {
  '@context': 'https://schema.org', '@type': 'Organization', '@id': `${site.origin}/#organization`,
  name: 'Society of Iranian Graduate Students at UC Irvine', alternateName: 'SIGS',
  url: site.origin, email: site.email, logo: `${site.origin}/favicon.png`,
};

export interface ShareImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export function eventShareImage(event: EventRecord | undefined, locale: Locale, records: readonly MediaRecord[]): ShareImage | undefined {
  if (!event || !isPublicEvent(event)) return undefined;
  const image = records.find(item => item.id === event.heroImage && item.kind !== 'video'
    && item.publication === 'published' && item.rights === 'approved');
  return image ? { src: image.src, alt: image.alt[locale] ?? image.alt.en ?? '', width: image.width, height: image.height } : undefined;
}

export function eventMetadata(event: EventRecord, locale: Locale = 'en'): Record<string, unknown> | null {
  const start = event.startInstant ?? event.allDay?.start;
  if (!isPublicEvent(event) || !event.generateEventStructuredData || !start) return null;
  const status = { tentative: 'EventScheduled', scheduled: 'EventScheduled', postponed: 'EventPostponed',
    rescheduled: 'EventRescheduled', cancelled: 'EventCancelled', completed: 'EventScheduled' }[event.eventState];
  return { '@context': 'https://schema.org', '@type': 'Event', name: event.title, description: event.summary,
    url: new URL(href(locale, `events/${event.slug}`), site.origin).href,
    startDate: start, ...(event.endInstant ? { endDate: event.endInstant } : {}),
    eventStatus: `https://schema.org/${status}`,
    ...(event.venue && event.venue !== 'Online' ? { location: { '@type': 'Place', name: event.venue } } : {}),
    organizer: { '@type': 'Organization', '@id': `${site.origin}/#organization`,
      name: organizationMetadata.name, url: site.origin, email: site.email },
  };
}

export function serializeMetadata(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
