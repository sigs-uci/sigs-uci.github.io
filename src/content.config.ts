import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { data, validatePublicData } from './data';
import { validateMediaCollections } from './lib/media';

const errors = [...validatePublicData(data),...validateMediaCollections()];
if (errors.length) throw new Error(`Public content validation failed:\n${errors.join('\n')}`);

const id = z.string().min(1);
const text = z.string().min(1);
const optionalText = z.string().nullable();
const publication = z.enum(['draft', 'published']);
const editorial = z.enum(['draft', 'edited', 'reviewed', 'not_translated']);
const events = defineCollection({
  loader: file('src/data/events.json'),
  schema: z.looseObject({ id, slug: text, title: text, summary: text, locale: z.literal('en'),
    date: z.object({ value: optionalText, precision: z.enum(['day', 'day_context_year', 'year_context', 'unknown']), contextYear: z.number().int().nullable() }),
    timeDisplay: optionalText, timeZone: optionalText, startInstant: optionalText, endInstant: optionalText,
    venue: optionalText, category: z.enum(['culture', 'film-poetry', 'community', 'newcomers', 'professional']),
    sigsRole: text, occurrenceEvidence: text, archiveLabel: optionalText, publication,
    eventState: z.enum(['tentative', 'scheduled', 'postponed', 'rescheduled', 'cancelled', 'completed']),
    registration: z.enum(['not_required', 'not_open', 'open', 'full', 'waitlist', 'closed']), registrationUrl: optionalText, registrationNote: optionalText.optional(), rulesUrl: z.url().nullable().optional(),
    gallery: z.array(text), heroImage: optionalText, editorial: z.object({ en: editorial, fa: editorial }),
    publicSourceLinks: z.array(z.url()), generateCalendarDownload: z.boolean(), generateEventStructuredData: z.boolean(),
  }),
});

const people = defineCollection({ loader: file('src/data/people.json'), schema: z.object({ id, name: text, portrait: optionalText, bio: optionalText, linkedinUrl: z.url().nullable().optional() }) });
const boardTerms = defineCollection({ loader: file('src/data/boardTerms.json'), schema: z.object({ id, term: text,
  status: z.enum(['current', 'former']), people: z.array(z.object({ id, personId: text, termId: text, name: text,
    role: text, group: z.enum(['board', 'support', 'advisor']), displayOrder: z.number().int().positive(),
    telegramUrl: optionalText, portrait: optionalText, bio: optionalText, membershipTerm: optionalText })) }) });
const programs = defineCollection({ loader: file('src/data/programs.json'), schema: z.object({ id, name: text, summary: text, period: text }) });
const programDetails = defineCollection({ loader: file('src/data/programDetails.json'), schema: z.object({ id, title: text, intro: text,
  periodLabel: text, sections: z.array(z.object({ title: text, paragraphs: z.array(text).min(1) })).min(1),
  relatedEventIds: z.array(text), relatedPaths: z.array(z.object({ label: text, path: text,
    query: z.object({ period: z.enum(['all', 'past', 'upcoming']).optional(),
      category: z.enum(['culture', 'film-poetry', 'community', 'newcomers', 'professional']).optional() })
      .strict().refine(query => Object.keys(query).length > 0, 'Event query needs a filter').optional(),
  }).strict().refine(link => !link.query || ['events', 'events/archive'].includes(link.path), 'Event filters need an event listing')),
  publicContextLinks: z.array(z.object({ label: text, url: z.url() })) }) });
const milestones = defineCollection({ loader: file('src/data/milestones.json'), schema: z.object({ id, year: z.number().int(), title: text,
  summary: text, eventIds: z.array(text), precision: text }) });
const resources = defineCollection({ loader: file('src/data/resources.json'), schema: z.object({ id, category: text, title: text,
  description: text, url: z.url(), source: text, reviewedOn: text, reviewScope: text, ownerRole: text }) });
const media = defineCollection({ loader: file('src/data/media.json'), schema: z.object({ id, src: text,
  thumbnail: z.string().optional(), kind: z.enum(['photo', 'poster', 'video']).optional(),
  videoPoster: z.string().optional(), duration: z.number().positive().optional(),
  audioContent: z.enum(['music', 'speech', 'silent', 'ambient']).optional(),
  audioNote: z.object({ en: text.optional(), fa: text.optional() }).optional(),
  transcript: z.object({ en: text.optional(), fa: text.optional() }).optional(),
  captions: z.object({ en: text.optional(), fa: text.optional() }).optional(),
  width: z.number().int().positive(), height: z.number().int().positive(), eventId: optionalText,
  focalPoint: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]),
  alt: z.object({ en: text, fa: z.string().optional() }), caption: z.object({ en: z.string().optional(), fa: z.string().optional() }),
  credit: text, publication, rights: z.enum(['approved', 'pending']) }) });
const stories = defineCollection({ loader: file('src/data/stories.json'), schema: z.object({ id, slug: text, title: text,
  summary: text, locale: z.enum(['en', 'fa']), publication, editorial, publishedOn: text, body: z.array(text),
  relatedEventIds: z.array(text), mediaIds: z.array(text), kind: z.enum(['story', 'yearbook', 'document']), credit: optionalText, contextNote: text.optional() }) });
const eventTranslations = defineCollection({
  loader: file('src/data/eventTranslations.json', { parser: (source) => JSON.parse(source).map((record: { eventId: string }) => ({ ...record, id: `fa:${record.eventId}` })) }),
  schema: z.object({ id, eventId: text, locale: z.literal('fa'), title: text, summary: text, body: z.array(text),
    status: editorial, sourceRevision: text, reviewedOn: optionalText }),
});

export const collections = { events, people, boardTerms, programs, programDetails, milestones, resources, media, stories, eventTranslations };
