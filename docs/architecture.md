# How the site fits together

Astro builds static routes for `https://sigs-uci.github.io`, with no repository-name prefix. English pages live under `/en/` and Persian pages under `/fa/`. The root opens English, with the language switch available on each page. `/404.html` provides recovery links in both languages for missing locations on Pages.

`src/data/index.ts` exposes typed collections. Astro loads the JSON files through `src/content.config.ts` with Zod schemas. `src/data/schema.ts` also validates relationships, including dates, team memberships, media permissions and translation review states. Build and runtime code use these public records alone. Test fixtures stay under `tests/` and are not imported by production routes.

`src/lib/events.ts` owns the event publication selector, the next event, filters, query strings, date display, search normalization and registration actions. Event search matches separate words across both language versions, places, recorded dates and lifecycle states. Callers pass a clock for deterministic tests. Date-only archive records retain their uncertainty. A past date does not change an event's occurrence evidence.

`src/lib/archive.ts` groups published historical records into populated years. Those groups generate durable year pages and supply the homepage archive feature. Program profiles in `src/data/programDetails.json` link canonical event IDs to historical context. Neither view creates extra events or changes their evidence labels.

`src/data/media.json` holds photograph, poster and video records. `src/data/mediaCollections.json` assigns every published, approved media record to exactly one collection. `src/lib/media.ts` exposes the `MediaCollection` interface, selects public media, validates collection references and bilingual copy, and supplies collection paths. Each collection gets a page under `/en/community/memories/` and `/fa/community/memories/`. A thematic collection can remain undated. Related archive links provide context; they do not establish the date or event association of an individual image.

Videos use native browser controls with local MP4 files, WebP poster frames and descriptive text in both languages. The audio classification describes the published file. Silent web editions say so in their captions and descriptions. Original recordings remain in controlled storage. The `transcript` field holds the scene description and relevant sound information. Rehearsals, invitations and event recordings retain their distinct context.

Album pages put uncropped photo previews before the video section. Large collections show 36 photographs per page, with static links under the collection's `/page/2/` and later routes. The first page keeps the original collection URL. Both language versions share the page number, and full album links connect event details to the remaining photographs. A poster index selects one native player on the first album page, with the clip ID in the URL fragment. Browser Back restores that selection and changing clips pauses the hidden player. Without JavaScript, every player remains available. Home has a horizontally scrollable selection of approved photographs and videos, with thumbnail links, keyboard and button controls, an image viewer and native inline video players. Offscreen videos pause, and starting another clip pauses the previous one. The strip remains scrollable without JavaScript.

`src/lib/calendar.ts` creates calendar snapshots from confirmed instants or genuine all-day ranges. It uses a stable event UID, UTC timed entries, exclusive all-day ends, valid calendar statuses, escaped text and UTF-8 line folding. Historical records do not get invented instants or calendar downloads.

Pagefind indexes the same `dist/` produced by Astro, with separate English and Persian indexes selected from the page language. Search loads on demand. Searchable templates mark their content body; redirects, search pages, 404 and unpublished routes stay outside the index. Albums enter search through their first page; later image pages remain linked through pagination without repeating the same album in search results. Persian normalization covers common yeh/kaf forms and half-spaces; it does not promise language stemming.

`src/i18n/fa.json` holds reviewed Persian interface text and shared-content descriptions. Event translations in `src/data/eventTranslations.json` refer to the exact English title and summary revision. Stale or missing event translations keep their English destination rather than presenting English copy as Persian. Dates use the Gregorian calendar in both languages; stored dates, identifiers and contact URLs do not change with display formatting.

The UI uses Manrope and Vazirmatn, CSS tokens and small client enhancements. The emblem remains still. Reading and ordinary links work without JavaScript. Event filters, the calendar and gallery reuse the same records as their list/detail views. Media is published only after its rights and public credit are recorded.

`src/styles/shell.css` refines the shared masthead and footer. The photographic homepage uses `home.css`; the event explorer and detail use `events.css` and `event-detail.css`. `media.css` controls collection directories, photo contact sheets and video browsing. Homepage features are selected from approved records in `Home.astro` and `HomeMedia.astro`; the complete libraries remain on their collection and archive pages.

## Verification

`npm run check` validates content, collection assignments and collection text in both languages, then checks Astro/TypeScript. `npm test` exercises selectors, registration, query state, date precision, both daylight-saving transitions, calendar serialization and content relationships. `npm run links` checks internal targets and anchors in built HTML. `npm run output:check` checks static output, search, metadata and language counterparts. These commands run locally; GitHub CI is not configured. Deployment remains a manual release step.

These checks support review; they do not establish accessibility conformance or content approval. Review actual desktop and phone layouts, keyboard behavior, reduced motion and language shaping before a release. Performance measurements need a stated device and network profile; a lab result does not measure field interaction latency.

## Assets and licensing

Font files and their licenses are served locally. The logo master and derivatives preserve the supplied emblem. Photograph rights are separate and may require credits or removal. No analytics, membership form, payment system or private member database is configured by this static site.
