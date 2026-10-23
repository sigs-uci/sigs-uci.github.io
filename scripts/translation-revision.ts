import { events } from '../src/data';
import { eventTextRevision } from '../src/lib/publication';

const event = events.find(record => record.id === process.argv[2]);
if (!event) {
  console.error('Provide an existing public event ID');
  process.exitCode = 1;
} else console.log(eventTextRevision(event));
