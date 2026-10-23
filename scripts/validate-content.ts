import { data, validatePublicData } from '../src/data/index';
import { validateMediaCollections } from '../src/lib/media';

const errors = [...validatePublicData(data),...validateMediaCollections()];
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log(`Validated ${data.events.length} events and ${data.boardTerms.length} team terms`);
