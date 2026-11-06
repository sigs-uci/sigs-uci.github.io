import type { EventRecord } from '../data';
import type { MediaCollection } from './media';
import { isPublicEvent } from './events';

type CollectionEvents = Pick<MediaCollection, 'id' | 'eventIds'>;

export function relatedCollections<T extends CollectionEvents>(current: CollectionEvents,
  collections: readonly T[], records: readonly EventRecord[], limit = 3): T[] {
  if (!Number.isSafeInteger(limit) || limit < 1) return [];
  const publicEvents = new Map(records.filter(isPublicEvent).map(event => [event.id, event]));
  const eventIds = (collection: CollectionEvents) => new Set(collection.eventIds.filter(id => publicEvents.has(id)));
  const categories = (ids: ReadonlySet<string>) => new Set([...ids].map(id => publicEvents.get(id)!.category));
  const currentEvents = eventIds(current);
  const currentCategories = categories(currentEvents);
  return collections.filter(collection => collection.id !== current.id).map((collection, order) => {
    const ids = eventIds(collection);
    return {
      collection, order,
      sharedEvents: [...ids].filter(id => currentEvents.has(id)).length,
      sharedCategories: [...categories(ids)].filter(category => currentCategories.has(category)).length,
    };
  }).sort((a, b) => b.sharedEvents - a.sharedEvents || b.sharedCategories - a.sharedCategories || a.order - b.order)
    .slice(0, limit).map(result => result.collection);
}
