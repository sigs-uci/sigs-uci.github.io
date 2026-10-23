import { events, eventTranslations, stories, type EventRecord, type EventTranslation, type StoryRecord } from '../data';
import { href, locales, type Locale } from '../config/site';
import { pages } from './routes';
import { isPublicEvent } from './events';
import { createHash } from 'node:crypto';

export function eventTextRevision(event: Pick<EventRecord, 'title' | 'summary'>): string {
  return createHash('sha256').update(JSON.stringify({ title: event.title, summary: event.summary })).digest('hex');
}

export function reviewedTranslation(eventId: string, translations: readonly EventTranslation[] = eventTranslations,
  sourceEvents: readonly EventRecord[] = events): EventTranslation | undefined {
  const source = sourceEvents.find(event => event.id === eventId && isPublicEvent(event));
  return translations.find((translation) => translation.eventId === eventId && translation.locale === 'fa' && translation.status === 'reviewed'
    && translation.title.trim() && translation.summary.trim() && translation.body.every(paragraph => paragraph.trim())
    && Boolean(source && translation.reviewedOn && /^\d{4}-\d{2}-\d{2}$/.test(translation.reviewedOn)
      && Number.isFinite(Date.parse(translation.reviewedOn)) && new Date(translation.reviewedOn).toISOString().slice(0, 10) === translation.reviewedOn
      && translation.sourceRevision === eventTextRevision(source)));
}

export function isPublicStory(story: StoryRecord, enabled: readonly string[] = locales): boolean {
  return story.publication === 'published' && story.editorial === 'reviewed' && enabled.includes(story.locale)
    && !(story as StoryRecord & { synthetic?: boolean }).synthetic;
}

export function eventLocale(event: EventRecord, requested: Locale, translations: readonly EventTranslation[] = eventTranslations,
  enabled: readonly string[] = locales): Locale {
  return requested === 'fa' && enabled.includes('fa') && reviewedTranslation(event.id, translations, [event]) ? 'fa' : 'en';
}

export function eventHref(event: EventRecord, requested: Locale): string {
  return href(eventLocale(event, requested), `events/${event.slug}`);
}

export function availableLocales(path: string): Locale[] {
  const event = events.find((record) => path === `events/${record.slug}` && isPublicEvent(record));
  if (event) return locales.filter((locale) => locale === 'en' || Boolean(reviewedTranslation(event.id))) as Locale[];
  if (path.startsWith('community/stories/')) return locales.filter((locale) => stories.some((story) =>
    path === `community/stories/${story.slug}` && story.locale === locale && isPublicStory(story))) as Locale[];
  return pages.some((page) => page.path === path) ? [...locales] : [];
}
