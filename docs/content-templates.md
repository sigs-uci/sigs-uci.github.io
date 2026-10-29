# Public content fields

These templates describe records, not events to publish. Prepare missing details outside this repository and add the record once its public content is ready. The TypeScript interfaces in `src/data/schema.ts` are the field reference; `MediaCollection` is defined in `src/lib/media.ts`.

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

## Program profile

Each theme in `src/data/programs.json` has a matching record in `src/data/programDetails.json`. Keep its historical period explicit. Add titled sections, supported public paragraphs, canonical event IDs, related local paths, and suitable public context links. The program page links existing event records; it does not create new occurrences. A program profile is not a current schedule.

Each `relatedPaths` entry needs a `label` and local `path`. An optional `query` can filter links to `events` or `events/archive`:

```json
{ "label": "Browse the cultural archive", "path": "events/archive", "query": { "category": "culture" } }
```

Allowed filters are `period` (`all`, `past`, `upcoming`) and `category` (`culture`, `film-poetry`, `community`, `newcomers`, `professional`). A query must contain at least one filter; other keys, values and destinations are rejected. Keep query parameters out of `path`; the page appends them after constructing the localized URL.

## Media

A `MediaRecord` needs a stable ID, local public asset path, width and height, focal point from 0 to 1, English and Persian alt text and caption, and public credit. Use `kind: "photo"`, `"poster"` or `"video"`. Its publication and rights states are separate. Published event pages may reference only published media with approved rights.

Set `eventId` to a supported canonical event ID or null. Unknown names and dates can stay unknown in an undated thematic collection. A filename, folder label or similar-looking room is not enough to establish a date or event association.

Image `src` paths use WebP derivatives. An optional `thumbnail` points to a smaller local WebP file for gallery previews. Use `kind: "poster"` for a historical poster that should be shown in full. Poster wording and QR codes stay in their dated context; they do not reopen registration. Record the dimensions of the actual public derivative after preparing it. Preserve visible credits and use an honest unknown-credit label when the photographer or designer is not recorded.

Video `src` paths use MP4. A published video also needs `videoPoster` pointing to a local WebP frame, positive `duration` in seconds, `audioContent`, and English and Persian descriptive text in `transcript`. `audioContent` describes the public file and accepts `silent`, `ambient`, `music` or `speech`. Preserve the original sound. Use `silent` for files without an audio track and explain when the original has no sound. If there is a specific editorial reason to remove audio, identify that edition in both descriptions. Speech requires reviewed timed WebVTT files in both languages through `captions.en` and `captions.fa`. The player offers both tracks and defaults to the page language. The visible caption gives the supported occasion or context without guessing event names or dates. Put visual detail in alt text and `transcript`, and describe relevant sound in `transcript`.

An optional `audioNote` gives visitors a visible explanation of an audio limitation, such as a gap already present in the source. Supply both `en` and `fa`. Do not fill missing original audio with an unrelated soundtrack or infer the cause of a gap.

## Media collection

Add collections in `src/data/mediaCollections.json`. Each record needs:

| Field | What to enter |
| --- | --- |
| `id` | A stable lowercase identifier with hyphens, used in the collection URL |
| `title`, `description` | Required English and Persian text about the supported occasion or subject; omit unconfirmed event names and dates |
| `note` | Optional; when included, provide both English and Persian text |
| `coverId` | A media ID that belongs to this collection |
| `mediaIds` | The distinct media IDs in display order |
| `eventIds` | Related published event IDs, or an empty array when no association is established |

Every published, approved media record belongs to exactly one collection. Validation checks that assignment, the cover, both language versions and published media/event references. Collection links can point to related historical context without assigning those events to every photograph. Add an individual `eventId` only when that image's association is supported. Collections do not create dated events or turn archived announcements into documented gatherings.

## Team term

A `BoardTerm` holds its ID, displayed term, current/former state and ordered memberships. Each membership links a stable person ID to that term, with the approved public name, role, group, display order and term-specific Telegram URL. Optional portrait, biography and continuous membership dates remain null when unknown.

## Story, document or annual highlights

A `StoryRecord` in `src/data/stories.json` needs a stable ID/slug, title, summary, locale, publication/editorial states, actual publication date, body paragraphs, related event IDs, approved media IDs and any approved credit. Use `kind: "yearbook"` for annual highlights. Publish an edition only after its reflections and claims have been reviewed. A gallery uses existing event records; it does not create duplicate events.

Use `kind: "document"` for a historical document with readable text and its original pages. A published document requires readable body paragraphs and a separate `contextNote` explaining its historical context. Preserve the original date and institutional authorship, and distinguish the historical text from a current invitation or position. Provide a reviewed record for each language, sharing the same slug, and keep page IDs in reading order. A collection links to a reading when they share approved media. Check a transcription against every original page and review its translation before publication.

## Event translation

An `EventTranslation` holds the shared event ID, locale `fa`, reviewed title/summary/body, editorial state, source revision and actual review date. Logistics stay in the shared event record. A source wording change calls for another translation review.
