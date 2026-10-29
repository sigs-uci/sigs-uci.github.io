import { boardTerms, organization, programs, type BoardTerm } from '../data';
import { archiveYears } from './archive';
import { mediaCollections, albumPagePath, albumPages } from './media';

const corePages = [
  { path: '', title: 'Meet SIGS.', description: 'The Iranian graduate student community at UC Irvine. Find gatherings, meet the team, and get in touch.' },
  { path: 'events', title: 'Events', description: 'Find SIGS gatherings and browse the event archive by year or topic.' },
  { path: 'events/archive', title: 'The event archive', description: 'Cultural celebrations, film, poetry, and community gatherings from the SIGS record.' },
  { path: 'community', title: 'A community beyond the classroom.', description: 'Celebrations, conversations, and connections across the Iranian graduate community at UC Irvine.' },
  { path: 'community/memories', title: 'Memories', description: 'Photos and videos from SIGS celebrations and outings, alongside invitations from past events.' },
  { path: 'community/videos', title: 'Videos', description: 'Watch short films from SIGS gatherings, celebrations and outings.' },
  { path: 'resources', title: 'Find what you need.', description: 'Official UC Irvine resources for arriving on campus, student life, and support.' },
  { path: 'resources/new-students', title: 'New to UCI?', description: 'A starting point for housing, campus services, transport, and finding your community.' },
  { path: 'about', title: 'This is SIGS.', description: 'Meet the Society of Iranian Graduate Students at UC Irvine and the people who keep it going.' },
  { path: 'about/leadership', title: 'Leadership & Team', description: 'Meet the current SIGS team and browse previous terms.' },
  { path: 'about/history', title: 'Our shared history.', description: 'A partial chronology of SIGS, with a path back to the event archive.' },
  { path: 'partners', title: 'Help good things happen.', description: 'Talk with SIGS about cultural gatherings, newcomer support, and professional conversations.' },
  { path: 'join', title: 'Come be part of it.', description: 'Get in touch with SIGS, attend a gathering, or help organize the next one.' },
  { path: 'contact', title: 'Say hello.', description: 'Contact SIGS about joining, events, partnerships, accessibility, or archive corrections.' },
  { path: 'search', title: 'Search SIGS', description: 'Search events, resources, and the SIGS community website.' },
  { path: 'privacy', title: 'Privacy', description: 'How this static website handles search, email links, hosting, and external services.' },
  { path: 'accessibility', title: 'Accessibility', description: 'Accessibility features, known content limits, and how to report a barrier.' },
  { path: 'languages', title: 'English and Persian', description: 'Read SIGS in English and Persian, with shared event facts and a route for language corrections.' },
];

export function buildPages(terms: readonly BoardTerm[] = boardTerms, currentTermId = organization.currentBoardTermId) {
  const current = terms.find(term => term.id === currentTermId);
  return [
    ...corePages.map(page => page.path === 'about/leadership' && current
      ? { ...page, description: `The current SIGS leadership and team for ${current.term}.` }
      : page),
    ...terms.map(term => ({ path: `about/leadership/${term.id}`, title: `The ${term.term} team`,
      description: `The ${term.status === 'current' ? 'current' : 'previous'} SIGS team, with roles and contacts listed for ${term.term}.` })),
    ...programs.map(program => ({ path: `community/programs/${program.id}`, title: program.name, description: program.summary })),
    ...mediaCollections.flatMap(collection=>Array.from({length:albumPages(collection)},(_,index)=>({path:albumPagePath(collection,index+1),title:collection.title.en,description:collection.description.en}))),
    ...archiveYears().map(entry => ({ path: `events/archive/${entry.year}`, title: `SIGS in ${entry.year}`,
      description: `Browse ${entry.records.length} historical event record${entry.records.length === 1 ? '' : 's'} from ${entry.year}, with dates, descriptions, and the context of each gathering or announcement.` })),
  ];
}

export const pages = buildPages();
