import { programs } from '../data';
import { archiveYears, archiveDescription } from './archive';
import { mediaCollections, albumPagePath, albumRoutePages } from './media';
import type { Locale } from '../config/site';

export interface PageDefinition {
  path: string;
  title: string;
  description: string;
  localized?: Partial<Record<Locale, { title: string; description: string }>>;
  redirectTo?: string;
}

const corePages = [
  { path: '', title: 'Society of Iranian Graduate Students', description: 'The Iranian graduate student community at UC Irvine. Find gatherings and get in touch.' },
  { path: 'events', title: 'Events', description: "See what's coming up at SIGS, or find past events by year or topic." },
  { path: 'events/archive', title: 'The event archive', description: 'Past SIGS events and invitations, from Nowruz and Yalda to film nights and beach outings.' },
  { path: 'community', title: 'Community', description: 'Meet the Iranian graduate community at UC Irvine through our celebrations, photos and stories.' },
  { path: 'community/memories', title: 'Memories', description: 'Photos and videos from SIGS celebrations and outings, alongside invitations from past events.' },
  { path: 'community/videos', title: 'Videos', description: 'Watch videos from SIGS events and rehearsals, along with invitations from past years.' },
  { path: 'resources', title: 'Campus resources', description: 'Official UC Irvine resources for arriving on campus, student life, and support.' },
  { path: 'resources/new-students', title: 'New to UCI?', description: 'A starting point for housing, campus services, transport, and finding your community.' },
  { path: 'about', title: 'About SIGS', description: 'Learn about the Society of Iranian Graduate Students at UC Irvine and its activities.' },
  { path: 'about/history', title: 'SIGS history', description: 'Look back at SIGS celebrations, outings and student activities by year.' },
  { path: 'partners', title: 'Work with SIGS', description: 'Have an idea for a SIGS event or collaboration? Get in touch with the team.' },
  { path: 'join', title: 'Join SIGS', description: 'Get in touch with SIGS, attend a gathering, or help organize the next one.' },
  { path: 'contact', title: 'Contact SIGS', description: 'Contact SIGS about joining, events, partnerships, accessibility, or archive corrections.' },
  { path: 'search', title: 'Search SIGS', description: 'Search events, resources, and the SIGS community website.' },
  { path: 'privacy', title: 'Privacy', description: 'How this website handles page-view statistics, search, email links and external services.' },
  { path: 'accessibility', title: 'Accessibility', description: 'Accessibility features, known content limits, and how to report a barrier.' },
  { path: 'languages', title: 'English and Persian', description: 'Switch between English and Persian, or send us a translation correction.' },
];

export function buildPages(): PageDefinition[] {
  return [
    ...corePages,
    ...programs.map(program => ({ path: `community/programs/${program.id}`, title: program.name, description: program.summary })),
    ...mediaCollections.flatMap(collection=>Array.from({length:albumRoutePages(collection)},(_,index)=>({path:albumPagePath(collection,index+1),title:collection.title.en,description:collection.description.en,localized:{fa:{title:collection.title.fa,description:collection.description.fa}}}))),
    ...archiveYears().map(entry => ({ path: `events/archive/${entry.year}`, title: `SIGS in ${entry.year}`,
      description: archiveDescription(entry.year, entry.records.length),
      localized: { fa: { title: `SIGS در ${new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(Number(entry.year))}`, description: archiveDescription(entry.year, entry.records.length, 'fa') } } })),
  ];
}

export const pages = buildPages();

export const legacyRedirects: PageDefinition[] = [
  'about/leadership',
  ...Array.from({ length: 19 }, (_, index) => `about/leadership/${2008 + index}-${2009 + index}`),
].map(path => ({ path, title: 'About SIGS', description: corePages.find(page => page.path === 'about')!.description, redirectTo: 'about' }));
