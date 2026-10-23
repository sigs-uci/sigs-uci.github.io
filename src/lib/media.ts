import { events, media, type MediaRecord, type Locale } from '../data';
import collectionData from '../data/mediaCollections.json';
import {isPublicEvent} from './events';

export interface MediaCollection {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  note: Record<Locale, string>;
  coverId: string;
  mediaIds: string[];
  eventIds: string[];
}

export const publicMedia = media.filter(item => item.publication === 'published' && item.rights === 'approved');
export const mediaCollections = collectionData as MediaCollection[];
export const publicVideos = publicMedia.filter(item => item.kind === 'video');
export const collectionItems = (collection: MediaCollection): MediaRecord[] => collection.mediaIds
  .map(id => publicMedia.find(item => item.id === id)).filter((item): item is MediaRecord => Boolean(item));
export const collectionPath = (collection: MediaCollection): string => `community/memories/${collection.id}`;
export function validateMediaCollections(collections: readonly MediaCollection[] = mediaCollections, records: readonly MediaRecord[] = media): string[] {
  const errors: string[] = [];
  const visible = records.filter(item=>item.publication==='published'&&item.rights==='approved');
  const ids = new Set<string>();
  const assignments = new Map<string,number>();
  for(const collection of collections){
    const key=`collections.${collection.id}`;
    const issue=(message:string)=>errors.push(`${key}: ${message}`);
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(collection.id)||ids.has(collection.id))issue('Collection needs a safe unique ID');
    ids.add(collection.id);
    if(Object.keys(collection).some(field=>!['id','title','description','note','coverId','mediaIds','eventIds'].includes(field)))issue('Contains an unsupported field');
    for(const text of [collection.title,collection.description,collection.note])if(!text?.en?.trim()||!text?.fa?.trim())issue('Text needs both languages');
    if(!collection.mediaIds.length||new Set(collection.mediaIds).size!==collection.mediaIds.length)issue('Collection needs distinct media');
    if(!collection.mediaIds.includes(collection.coverId))issue('Cover must belong to the collection');
    for(const id of collection.mediaIds){
      if(!visible.some(item=>item.id===id))issue('Media must be published with permission');
      assignments.set(id,(assignments.get(id)??0)+1);
    }
    if(new Set(collection.eventIds).size!==collection.eventIds.length)issue('Event links must be distinct');
    for(const id of collection.eventIds)if(!events.some(event=>event.id===id&&isPublicEvent(event)))issue('Event link must identify a public record');
  }
  for(const item of visible)if(assignments.get(item.id)!==1)errors.push(`media.${item.id}: Needs one collection`);
  return errors;
}
export function videoDuration(seconds: number, locale: Locale): string {
  const number = new Intl.NumberFormat(locale, { useGrouping: false, minimumIntegerDigits: 2 });
  const rounded = Math.round(seconds);
  return `${new Intl.NumberFormat(locale, { useGrouping: false }).format(Math.floor(rounded / 60))}:${number.format(rounded % 60)}`;
}
