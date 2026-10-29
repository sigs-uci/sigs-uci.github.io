export type Locale = 'en' | 'fa';
export type Publication = 'draft' | 'published';
export type EventState = 'tentative' | 'scheduled' | 'postponed' | 'rescheduled' | 'cancelled' | 'completed';
export type RegistrationState = 'not_required' | 'not_open' | 'open' | 'full' | 'waitlist' | 'closed';
export type EventCategory = 'culture' | 'film-poetry' | 'community' | 'newcomers' | 'professional';
export type OccurrenceEvidence = 'announced' | 'announced_with_platform_recap' | 'announced_with_media_collection' | 'occurrence_corroborated' | 'occurrence_reported' | 'institutional_retrospective' | 'reported_occurrence';
export type EditorialState = 'draft' | 'edited' | 'reviewed' | 'not_translated';

export interface HistoricalDate {
  value: string | null;
  precision: 'day' | 'day_context_year' | 'year_context' | 'unknown';
  contextYear: number | null;
}

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  locale: 'en';
  date: HistoricalDate;
  timeDisplay: string | null;
  timeZone: string | null;
  startInstant: string | null;
  endInstant: string | null;
  venue: string | null;
  category: EventCategory;
  sigsRole: string;
  summary: string;
  occurrenceEvidence: OccurrenceEvidence;
  archiveLabel: 'Documented gathering' | 'Archived announcement' | null;
  publication: Publication;
  eventState: EventState;
  registration: RegistrationState;
  registrationUrl: string | null;
  registrationNote?: string | null;
  rulesUrl?: string | null;
  gallery: string[];
  heroImage: string | null;
  editorial: Record<Locale, EditorialState>;
  publicSourceLinks: string[];
  generateCalendarDownload: boolean;
  generateEventStructuredData: boolean;
  allDay?: { start: string; end: string } | null;
  calendarUpdated?: string;
  calendarSequence?: number;
  accessibility?: string;
  cost?: string;
  audience?: string;
}

export interface PersonRecord {
  id: string;
  name: string;
  portrait: string | null;
  bio: string | null;
  linkedinUrl?: string | null;
}

export interface TeamMembership {
  id: string;
  personId: string;
  termId: string;
  name: string;
  role: string;
  group: 'board' | 'support' | 'advisor';
  displayOrder: number;
  telegramUrl: string | null;
  portrait: string | null;
  bio: string | null;
  membershipTerm: string | null;
}

export interface BoardTerm {
  id: string;
  term: string;
  status: 'current' | 'former';
  people: TeamMembership[];
}

export interface ProgramRecord {
  id: string;
  name: string;
  summary: string;
  period: string;
}

export interface ProgramRelatedLink {
  label: string;
  path: string;
  query?: { period?: 'all' | 'past' | 'upcoming'; category?: EventCategory };
}

export interface ProgramDetail {
  id: string;
  title: string;
  intro: string;
  periodLabel: string;
  sections: { title: string; paragraphs: string[] }[];
  relatedEventIds: string[];
  relatedPaths: ProgramRelatedLink[];
  publicContextLinks: { label: string; url: string }[];
}

export interface MilestoneRecord {
  id: string;
  year: number;
  title: string;
  summary: string;
  eventIds: string[];
  precision: HistoricalDate['precision'];
}

export interface ResourceRecord {
  id: string;
  category: 'arriving' | 'settling-in' | 'campus' | 'support' | 'connections';
  title: string;
  description: string;
  url: string;
  source: string;
  reviewedOn: string;
  reviewScope: string;
  ownerRole: string;
}

export interface MediaRecord {
  id: string;
  src: string;
  thumbnail?: string;
  kind?: 'photo' | 'poster' | 'video';
  videoPoster?: string;
  duration?: number;
  audioContent?: 'music' | 'speech' | 'silent' | 'ambient';
  audioNote?: Partial<Record<Locale, string>>;
  transcript?: Partial<Record<Locale, string>>;
  captions?: Partial<Record<Locale, string>>;
  width: number;
  height: number;
  eventId: string | null;
  focalPoint: [number, number];
  alt: Partial<Record<Locale, string>>;
  caption: Partial<Record<Locale, string>>;
  credit: string;
  publication: Publication;
  rights: 'approved' | 'pending';
}

export interface EventTranslation {
  eventId: string;
  locale: 'fa';
  title: string;
  summary: string;
  body: string[];
  status: EditorialState;
  sourceRevision: string;
  reviewedOn: string | null;
}

export interface StoryRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  locale: Locale;
  publication: Publication;
  editorial: EditorialState;
  publishedOn: string;
  body: string[];
  relatedEventIds: string[];
  mediaIds: string[];
  kind: 'story' | 'yearbook' | 'document';
  credit: string | null;
  contextNote?: string;
}

export interface OrganizationRecord {
  name: string;
  shortName: string;
  institution: string;
  displayName: string;
  email: string;
  origin: string;
  timeZone: string;
  description: string;
  currentBoardTermId: string;
  currentBoard: TeamMembership[];
  currentBoardNotice: string | null;
  currentSponsors: { name: string; url: string | null; logo: string | null }[];
  telegramInvite: string | null;
  upcomingEvents: string[];
  registration: { status: 'registered'; termId: string; confirmedOn: string; confirmation: 'user_confirmed' };
  historicalAcknowledgments: { context: string; names: string[]; relationship: string }[];
  socialChannels: { name: string; url: string }[];
}

export interface MigrationRecord {
  from: string;
  to: string;
  disposition: 'reference' | 'redirect';
  note: string;
}

export interface PublicData {
  organization: OrganizationRecord;
  events: EventRecord[];
  programs: ProgramRecord[];
  programDetails: ProgramDetail[];
  people: PersonRecord[];
  boardTerms: BoardTerm[];
  milestones: MilestoneRecord[];
  resources: ResourceRecord[];
  media: MediaRecord[];
  stories: StoryRecord[];
  eventTranslations: EventTranslation[];
  migrations: MigrationRecord[];
}

const occurrenceSupported = new Set<OccurrenceEvidence>(['occurrence_corroborated', 'occurrence_reported', 'institutional_retrospective', 'reported_occurrence']);
const eventKeys = new Set(['id', 'slug', 'title', 'locale', 'date', 'timeDisplay', 'timeZone', 'startInstant', 'endInstant', 'venue', 'category', 'sigsRole', 'summary', 'occurrenceEvidence', 'archiveLabel', 'publication', 'eventState', 'registration', 'registrationUrl', 'registrationNote', 'rulesUrl', 'gallery', 'heroImage', 'editorial', 'publicSourceLinks', 'generateCalendarDownload', 'generateEventStructuredData', 'allDay', 'calendarUpdated', 'calendarSequence', 'accessibility', 'cost', 'audience']);
const storyKeys = new Set(['id', 'slug', 'title', 'summary', 'locale', 'publication', 'editorial', 'publishedOn', 'body', 'relatedEventIds', 'mediaIds', 'kind', 'credit', 'contextNote']);
const translationKeys = new Set(['eventId', 'locale', 'title', 'summary', 'body', 'status', 'sourceRevision', 'reviewedOn']);
const mediaKeys = new Set(['id', 'src', 'thumbnail', 'kind', 'videoPoster', 'duration', 'audioContent', 'audioNote', 'transcript', 'captions', 'width', 'height', 'eventId', 'focalPoint', 'alt', 'caption', 'credit', 'publication', 'rights']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isDay(value: string): boolean {
  return datePattern.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function isInstant(value: string): boolean {
  return instantPattern.test(value) && isDay(value.slice(0, 10))
    && Number(value.slice(11, 13)) <= 23 && Number(value.slice(14, 16)) <= 59
    && Number(value.slice(17, 19)) <= 59 && Number.isFinite(Date.parse(value));
}

function publicUrl(value: string, allowMail = false): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:' || (allowMail && url.protocol === 'mailto:')) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function localMediaPath(value: string, extension?: string): boolean {
  return /^\/media\/[A-Za-z0-9_./-]+$/.test(value) && value.split('/').every(part => part !== '.' && part !== '..')
    && (!extension || value.toLowerCase().endsWith(extension));
}

function linkedInProfileUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.linkedin.com'
      && /^\/in\/[A-Za-z0-9%_-]+\/?$/.test(url.pathname)
      && !url.username && !url.password && !url.port && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export function validatePublicData(data: PublicData): string[] {
  const errors: string[] = [];
  const issue = (path: string, message: string) => errors.push(`${path}: ${message}`);
  const unique = (records: { id: string }[], collection: string) => {
    const ids = records.map(record => record.id);
    if (new Set(ids).size !== ids.length) issue(collection, 'IDs must be unique');
  };
  for (const key of ['events', 'programs', 'programDetails', 'people', 'boardTerms', 'milestones', 'resources', 'media', 'stories'] as const) unique(data[key], key);
  const eventIds = new Set(data.events.map(event => event.id));
  const mediaIds = new Set(data.media.map(media => media.id));
  const mediaRecords = new Map(data.media.map(media => [media.id, media]));
  const visibleMedia = (id: string): boolean => mediaRecords.get(id)?.publication === 'published' && mediaRecords.get(id)?.rights === 'approved';
  const visibleImage = (id: string): boolean => visibleMedia(id) && mediaRecords.get(id)?.kind !== 'video';
  const people = new Map(data.people.map(person => [person.id, person]));
  data.people.forEach(person => {
    if (person.portrait && !visibleImage(person.portrait)) issue(`people.${person.id}`, 'Portraits need published images with permission');
    if (person.linkedinUrl !== undefined && person.linkedinUrl !== null && !linkedInProfileUrl(person.linkedinUrl)) issue(`people.${person.id}`, 'LinkedIn links must be public HTTPS profile URLs');
  });
  const slugs = data.events.map(event => event.slug);
  if (new Set(slugs).size !== slugs.length) issue('events', 'Slugs must be unique');
  data.events.forEach(event => {
    const key = `events.${event.id}`;
    if (Object.keys(event).some(field => !eventKeys.has(field))) issue(key, 'Contains an unsupported field');
    if (!slugPattern.test(event.id) || !slugPattern.test(event.slug)) issue(key, 'ID and slug must use lowercase words and hyphens');
    if (!event.title.trim() || !event.summary.trim()) issue(key, 'Title and summary are required');
    if (event.locale !== 'en') issue(key, 'Shared event facts must use the English record');
    if (event.date.value !== null && !isDay(event.date.value)) issue(key, 'Date must be a valid ISO day');
    if (!['day', 'day_context_year', 'year_context', 'unknown'].includes(event.date.precision)) issue(key, 'Unknown date precision');
    if (event.date.precision === 'unknown' && event.date.value !== null) issue(key, 'Unknown date precision cannot contain a day');
    if (event.date.precision === 'day_context_year' && event.date.contextYear === null) issue(key, 'Contextual year precision needs a year');
    if (event.date.value && event.date.contextYear && Number(event.date.value.slice(0, 4)) !== event.date.contextYear) issue(key, 'Date and context year disagree');
    if (!['culture', 'film-poetry', 'community', 'newcomers', 'professional'].includes(event.category)) issue(key, 'Unknown category');
    if (!['draft', 'published'].includes(event.publication)) issue(key, 'Unknown publication state');
    if (!['tentative', 'scheduled', 'postponed', 'rescheduled', 'cancelled', 'completed'].includes(event.eventState)) issue(key, 'Unknown event state');
    if (!['not_required', 'not_open', 'open', 'full', 'waitlist', 'closed'].includes(event.registration)) issue(key, 'Unknown registration state');
    if (!['announced', 'announced_with_platform_recap', 'announced_with_media_collection', 'occurrence_corroborated', 'occurrence_reported', 'institutional_retrospective', 'reported_occurrence'].includes(event.occurrenceEvidence)) issue(key, 'Unknown occurrence evidence');
    for (const state of Object.values(event.editorial)) {
      if (!['draft', 'edited', 'reviewed', 'not_translated'].includes(state)) issue(key, 'Unknown editorial state');
    }
    if (event.publication === 'published' && event.editorial.en === 'not_translated') issue(key, 'Published English events need English copy');
    if (event.eventState === 'completed' && !occurrenceSupported.has(event.occurrenceEvidence)) issue(key, 'Completed events need occurrence support');
    if (event.archiveLabel === 'Documented gathering' && !occurrenceSupported.has(event.occurrenceEvidence)) issue(key, 'Documented gatherings need occurrence support');
    if (event.archiveLabel === 'Archived announcement' && event.eventState === 'completed') issue(key, 'Announcement-only records cannot be completed');
    if (event.registrationUrl && !publicUrl(event.registrationUrl)) issue(key, 'Registration URL must be an ordinary web URL');
    if (event.registrationNote !== undefined && event.registrationNote !== null && !event.registrationNote.trim()) issue(key, 'Registration note must contain text');
    if (event.rulesUrl !== undefined && event.rulesUrl !== null && (!event.rulesUrl || !publicUrl(event.rulesUrl))) issue(key, 'Rules URL must be an ordinary web URL');
    if (['open', 'waitlist'].includes(event.registration) && !event.registrationUrl) issue(key, 'Active registration needs a destination');
    if (event.eventState === 'cancelled' && ['open', 'waitlist'].includes(event.registration)) issue(key, 'Cancelled events cannot offer active registration');
    if (event.startInstant && !isInstant(event.startInstant)) issue(key, 'Start must be an explicit instant');
    if (event.endInstant && !isInstant(event.endInstant)) issue(key, 'End must be an explicit instant');
    if (event.endInstant && !event.startInstant) issue(key, 'An end instant needs a start instant');
    if (event.startInstant && event.endInstant && Date.parse(event.endInstant) <= Date.parse(event.startInstant)) issue(key, 'End must follow start');
    if (event.startInstant && !event.timeZone) issue(key, 'Timed events need a timezone');
    if (event.timeZone) {
      try {
        const formatter = new Intl.DateTimeFormat('en', { timeZone: event.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        formatter.format();
        if (event.date.value && event.startInstant && isInstant(event.startInstant)) {
          const parts = formatter.formatToParts(new Date(event.startInstant));
          const part = (name: string) => parts.find(value => value.type === name)?.value;
          const localDay = `${part('year')}-${part('month')}-${part('day')}`;
          if (event.date.value !== localDay) issue(key, 'Event date must match the start day in its timezone');
        }
      }
      catch { issue(key, 'Timezone is invalid'); }
    }
    if (event.allDay) {
      if (!isDay(event.allDay.start) || !isDay(event.allDay.end) || event.allDay.end <= event.allDay.start) issue(key, 'All-day range needs valid days and an exclusive end');
      if (event.date.value && event.date.value !== event.allDay.start) issue(key, 'Event date must match the all-day start');
      if (event.startInstant || event.endInstant) issue(key, 'All-day dates and timed instants cannot be combined');
    }
    if ((event.generateCalendarDownload || event.generateEventStructuredData) && !event.startInstant && !event.allDay) issue(key, 'Calendar output needs a precise schedule');
    if (event.calendarUpdated && !isInstant(event.calendarUpdated)) issue(key, 'Calendar update must be an explicit instant');
    if (event.calendarSequence !== undefined && (!Number.isInteger(event.calendarSequence) || event.calendarSequence < 0)) issue(key, 'Calendar sequence must be a nonnegative integer');
    if (event.heroImage && !mediaIds.has(event.heroImage)) issue(key, 'Hero image reference does not exist');
    if (event.heroImage && mediaRecords.get(event.heroImage)?.kind === 'video') issue(key, 'Hero image must reference an image');
    event.gallery.forEach(id => { if (!mediaIds.has(id)) issue(key, 'Gallery reference does not exist'); });
    if (event.publication === 'published') {
      if (event.heroImage && !visibleMedia(event.heroImage)) issue(key, 'Published hero image needs published media with permission');
      event.gallery.forEach(id => { if (!visibleMedia(id)) issue(key, 'Published gallery needs published media with permission'); });
    }
    event.publicSourceLinks.forEach(url => { if (!publicUrl(url)) issue(key, 'Public source link is invalid'); });
  });
  data.boardTerms.forEach(term => {
    const key = `boardTerms.${term.id}`;
    unique(term.people, key);
    const orders = term.people.map(member => member.displayOrder);
    if (new Set(orders).size !== orders.length) issue(key, 'Display order must be unique within a term');
    term.people.forEach(member => {
      if (!people.has(member.personId) || people.get(member.personId)?.name !== member.name) issue(key, 'Person reference must match the public name');
      if (member.termId !== term.id || member.id !== `${term.id}:${member.personId}`) issue(key, 'Membership must belong to its term and person');
      if (!member.role.trim() || !['board', 'support', 'advisor'].includes(member.group)) issue(key, 'Role and group are required');
      if (!Number.isInteger(member.displayOrder) || member.displayOrder < 1) issue(key, 'Display order must be a positive integer');
      if (member.telegramUrl && !/^https?:\/\/t\.me\/[A-Za-z0-9_]+$/.test(member.telegramUrl)) issue(key, 'Team contact must be a public Telegram profile');
      if (member.portrait && !mediaIds.has(member.portrait)) issue(key, 'Portrait reference does not exist');
      if (member.portrait && !visibleImage(member.portrait)) issue(key, 'Team portraits need published images with permission');
    });
  });
  const current = data.boardTerms.filter(term => term.status === 'current');
  if (current.length !== 1 || current[0]?.id !== data.organization.currentBoardTermId) issue('organization', 'Current team must identify one matching term');
  if (JSON.stringify(current[0]?.people) !== JSON.stringify(data.organization.currentBoard)) issue('organization', 'Current team must match its term');
  if (data.organization.currentBoard.length > 0 && data.organization.currentBoardNotice !== null) issue('organization', 'A populated current team must not have a missing-team notice');
  data.resources.forEach(resource => {
    if (!publicUrl(resource.url) || !isDay(resource.reviewedOn) || !resource.source.trim() || !resource.ownerRole.trim()) issue(`resources.${resource.id}`, 'URL, review date, source and owner role are required');
  });
  data.milestones.forEach(milestone => milestone.eventIds.forEach(id => {
    if (!eventIds.has(id)) issue(`milestones.${milestone.id}`, 'Event reference does not exist');
  }));
  const detailKeys = new Set(['id', 'title', 'intro', 'periodLabel', 'sections', 'relatedEventIds', 'relatedPaths', 'publicContextLinks']);
  data.programDetails.forEach(program => {
    const key = `programDetails.${program.id}`;
    if (Object.keys(program).some(field => !detailKeys.has(field))) issue(key, 'Contains an unsupported field');
    if (!data.programs.some(theme => theme.id === program.id)) issue(key, 'Program theme does not exist');
    if (![program.title, program.intro, program.periodLabel].every(text => text.trim())) issue(key, 'Title, introduction and period are required');
    if (!program.sections.length || program.sections.some(section => !section.title.trim() || !section.paragraphs.length || section.paragraphs.some(text => !text.trim()))) issue(key, 'Sections need headings and paragraphs');
    program.relatedEventIds.forEach(id => { if (!eventIds.has(id)) issue(key, 'Event reference does not exist'); });
    program.relatedPaths.forEach(link => {
      if (!link.label.trim() || !/^[a-z0-9]+(?:[/-][a-z0-9]+)*$/.test(link.path)) issue(key, 'Related links need a label and local page path');
      if (Object.keys(link).some(field => !['label', 'path', 'query'].includes(field))) issue(key, 'Related link contains an unsupported field');
      if (link.query !== undefined) {
        if (!['events', 'events/archive'].includes(link.path)) issue(key, 'Event filters can only link to an event listing');
        if (!link.query || typeof link.query !== 'object' || Array.isArray(link.query) || Object.keys(link.query).length === 0
          || Object.keys(link.query).some(field => !['period', 'category'].includes(field))) issue(key, 'Related query needs supported event filters');
        else {
          if (link.query.period !== undefined && !['all', 'past', 'upcoming'].includes(link.query.period)) issue(key, 'Unknown related event period');
          if (link.query.category !== undefined && !['culture', 'film-poetry', 'community', 'newcomers', 'professional'].includes(link.query.category)) issue(key, 'Unknown related event category');
        }
      }
    });
    program.publicContextLinks.forEach(link => { if (!link.label.trim() || !publicUrl(link.url)) issue(key, 'Public context links need a label and web URL'); });
  });
  data.programs.forEach(program => { if (!data.programDetails.some(detail => detail.id === program.id)) issue(`programs.${program.id}`, 'Program needs a detail record'); });
  data.media.forEach(media => {
    const key = `media.${media.id}`;
    if (Object.keys(media).some(field => !mediaKeys.has(field))) issue(key, 'Contains an unsupported media field');
    if (!slugPattern.test(media.id)) issue(key, 'Media IDs must use lowercase words and hyphens');
    if (media.publication === 'published' && media.rights !== 'approved') issue(key, 'Published media needs permission');
    if (!['draft', 'published'].includes(media.publication) || !['approved', 'pending'].includes(media.rights)) issue(key, 'Unknown media publication or permission state');
    if (media.eventId && !eventIds.has(media.eventId)) issue(key, 'Event reference does not exist');
    if (!localMediaPath(media.src, media.kind === 'video' ? '.mp4' : '.webp')) issue(key, 'Asset must use a local public derivative path with the correct format');
    if (media.thumbnail !== undefined && !localMediaPath(media.thumbnail, '.webp')) issue(key, 'Thumbnail must use a local WebP path');
    if (media.kind && !['photo', 'poster', 'video'].includes(media.kind)) issue(key, 'Unknown media kind');
    if (!Number.isInteger(media.width) || !Number.isInteger(media.height) || media.width <= 0 || media.height <= 0 || !media.credit.trim()) issue(key, 'Dimensions and credit are required');
    if (media.focalPoint.length !== 2 || media.focalPoint.some(value => !Number.isFinite(value) || value < 0 || value > 1)) issue(key, 'Focal point coordinates must be between zero and one');
    if (!media.alt.en?.trim()) issue(key, 'English alternative text is required');
    if (media.publication === 'published') {
      if (!media.alt.en?.trim() || !media.alt.fa?.trim()) issue(key, 'Published media needs English and Persian alternative text');
      if (!media.caption.en?.trim() || !media.caption.fa?.trim()) issue(key, 'Published media needs English and Persian captions');
    }
    if (media.kind === 'video') {
      if (media.videoPoster !== undefined && !localMediaPath(media.videoPoster, '.webp')) issue(key, 'Video poster must use a local WebP path');
      if (media.duration !== undefined && (!Number.isFinite(media.duration) || media.duration <= 0)) issue(key, 'Video duration must be positive seconds');
      if (media.audioContent !== undefined && !['music', 'speech', 'silent', 'ambient'].includes(media.audioContent)) issue(key, 'Unknown video audio content');
      for (const [field, texts] of [['transcript', media.transcript], ['captions', media.captions], ['audioNote', media.audioNote]] as const) {
        if (texts && (Object.keys(texts).some(locale => !['en', 'fa'].includes(locale)) || Object.values(texts).some(text => !text?.trim()))) issue(key, `Video ${field} needs supported languages and nonblank values`);
      }
      if (media.captions) for (const value of Object.values(media.captions)) {
        if (value && !localMediaPath(value, '.vtt')) issue(key, 'Video captions must use local WebVTT paths');
      }
      if (media.publication === 'published') {
        if (!media.videoPoster || media.duration === undefined || !media.audioContent) issue(key, 'Published videos need a poster, duration and audio content classification');
        if (!media.transcript?.en?.trim() || !media.transcript.fa?.trim()) issue(key, 'Published videos need English and Persian descriptive transcripts');
        if (media.audioContent === 'speech' && (!media.captions?.en || !media.captions.fa)) issue(key, 'Speech videos need English and Persian timed captions');
        if (media.audioNote && (!media.audioNote.en?.trim() || !media.audioNote.fa?.trim())) issue(key, 'Audio notes need English and Persian text');
      }
    } else if (['videoPoster', 'duration', 'audioContent', 'audioNote', 'transcript', 'captions'].some(field => field in media)) issue(key, 'Video fields belong to video records');
  });
  const translated = new Set<string>();
  data.eventTranslations.forEach(translation => {
    const key = `eventTranslations.${translation.eventId}`;
    if (Object.keys(translation).some(field => !translationKeys.has(field))) issue(key, 'Contains an unsupported field; event facts belong to the shared record');
    if (translation.locale !== 'fa') issue(key, 'Event translations must use the Persian locale');
    if (!translation.title.trim() || !translation.summary.trim() || translation.body.some(paragraph => !paragraph.trim())) issue(key, 'Translated title, summary and supplied paragraphs must not be blank');
    if (!eventIds.has(translation.eventId) || translated.has(translation.eventId)) issue(key, 'Translation needs one existing shared event');
    translated.add(translation.eventId);
    if (!['draft', 'edited', 'reviewed', 'not_translated'].includes(translation.status)) issue(key, 'Unknown translation state');
    if (translation.status === 'reviewed' && (!translation.reviewedOn || !isDay(translation.reviewedOn) || !translation.sourceRevision.trim())) issue(key, 'Reviewed translations need an actual review date and source revision');
  });
  data.stories.forEach(story => {
    const key = `stories.${story.id}`;
    if (Object.keys(story).some(field => !storyKeys.has(field))) issue(key, 'Contains an unsupported field');
    if (!slugPattern.test(story.id) || !slugPattern.test(story.slug)) issue(key, 'ID and slug must use lowercase words and hyphens');
    if (!['en', 'fa'].includes(story.locale)) issue(key, 'Unknown story locale');
    if (!['draft', 'published'].includes(story.publication) || !['draft', 'edited', 'reviewed', 'not_translated'].includes(story.editorial)) issue(key, 'Unknown story publication or editorial state');
    if (!['story', 'yearbook', 'document'].includes(story.kind)) issue(key, 'Unknown story kind');
    if (!isDay(story.publishedOn)) issue(key, 'Publication date must be a valid ISO day');
    if (story.publication === 'published' && story.editorial !== 'reviewed') issue(key, 'Published stories need reviewed text');
    if (story.kind === 'document' && story.publication === 'published' && (typeof story.contextNote !== 'string' || !story.contextNote.trim() || !story.body.length || story.body.some(paragraph => !paragraph.trim()))) issue(key, 'Published documents need historical context and readable text');
    if (data.stories.some(other => other.id !== story.id && other.slug === story.slug && other.locale === story.locale)) issue(key, 'Story URL must be unique within a locale');
    story.relatedEventIds.forEach(id => { if (!eventIds.has(id)) issue(key, 'Event reference does not exist'); });
    story.mediaIds.forEach(id => { if (!mediaIds.has(id)) issue(key, 'Media reference does not exist'); });
    if (story.publication === 'published') story.mediaIds.forEach(id => { if (!visibleMedia(id)) issue(key, 'Published stories need published media with permission'); });
  });
  return errors;
}
