# Public content fields

These templates describe records, not events to publish. Prepare missing details outside this repository and add the record once its public content is ready. The TypeScript interfaces in `src/data/schema.ts` are the field reference.

## Event

| Field | What to enter |
| --- | --- |
| `id`, `slug` | A stable lowercase identifier with hyphens |
| `title`, `summary` | The public title and factual description |
| `locale` | `en`, the shared record language |
| `date` | Supported ISO day, precision and context year; retain nulls for unknown facts |
| `timeDisplay`, `timeZone` | Supported advertised time and timezone, or null |
| `startInstant`, `endInstant` | Confirmed instants with offsets, or null |
| `allDay` | Only for a real all-day event: start day and exclusive end day |
| `venue`, `cost`, `audience`, `accessibility` | Public logistics that have been checked |
| `category` | `culture`, `film-poetry`, `community`, `newcomers` or `professional` |
| `sigsRole` | The documented SIGS role |
| `occurrenceEvidence`, `archiveLabel` | Accurate occurrence support and historical label; a future event has no archive label |
| `publication` | `published` when ready for public inclusion |
| `eventState` | `tentative`, `scheduled`, `postponed`, `rescheduled`, `cancelled` or `completed` |
| `registration` | `not_required`, `not_open`, `open`, `full`, `waitlist` or `closed` |
| `registrationUrl` | An actual destination when registration or waitlist is active |
| `gallery`, `heroImage` | Approved published media IDs, or an empty array and null |
| `editorial` | English editing state and Persian translation state |
| `publicSourceLinks` | Suitable public references, if available |
| `generateCalendarDownload`, `generateEventStructuredData` | False without a precise schedule |
| `calendarUpdated`, `calendarSequence` | Actual update instant and nonnegative revision when calendars are enabled |

## Media

A `MediaRecord` needs a stable ID, local public asset path, width and height, optional event ID, focal point from 0 to 1, localized alt text and caption, and public credit. Its publication and rights states are separate. Published event pages may reference only published media with approved rights.

## Team term

A `BoardTerm` holds its ID, displayed term, current/former state and ordered memberships. Each membership links a stable person ID to that term, with the approved public name, role, group, display order and term-specific Telegram URL. Optional portrait, biography and continuous membership dates remain null when unknown.

## Story or annual highlights

A `StoryRecord` in `src/data/stories.json` needs a stable ID/slug, title, summary, locale, publication/editorial states, actual publication date, body paragraphs, related event IDs, approved media IDs and any approved credit. Use `kind: "yearbook"` for annual highlights. Publish an edition only after its reflections and claims have been reviewed. A gallery uses existing event records; it does not create duplicate events.

## Event translation

An `EventTranslation` holds the shared event ID, locale `fa`, reviewed title/summary/body, editorial state, source revision and actual review date. Logistics stay in the shared event record. A source wording change calls for another translation review.
