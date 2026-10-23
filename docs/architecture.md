# How the site fits together

Astro builds static routes for `https://sigs-uci.github.io`, with no repository-name prefix. English pages live under `/en/`. The root provides a language route and `/404.html` handles missing locations on Pages.

`src/data/index.ts` exposes typed collections. Astro loads the JSON files through `src/content.config.ts` with Zod schemas. `src/data/schema.ts` also validates relationships, including dates, team memberships, media permissions and translation review states. Build and runtime code use these public records alone. Test fixtures stay under `tests/` and are not imported by production routes.

`src/lib/events.ts` owns the event publication selector, the next event, filters, query strings, date display, search normalization and registration actions. Callers pass a clock for deterministic tests. Date-only archive records retain their uncertainty. A past date does not change an event's occurrence evidence.

`src/lib/archive.ts` groups published historical records into populated years. Those groups generate durable year pages and the homepage archive directory. Program profiles in `src/data/programDetails.json` link canonical event IDs to historical context. Neither view creates extra events or changes their evidence labels.

`src/lib/calendar.ts` creates calendar snapshots from confirmed instants or genuine all-day ranges. It uses a stable event UID, UTC timed entries, exclusive all-day ends, valid calendar statuses, escaped text and UTF-8 line folding. Historical records do not get invented instants or calendar downloads.

Pagefind indexes the same `dist/` produced by Astro. Search loads on demand. Searchable templates mark their content body; redirects, search pages, 404 and unpublished routes stay outside the index. Persian normalization covers common yeh/kaf forms and half-spaces; it does not promise language stemming.

The UI uses Manrope and Vazirmatn, CSS tokens and small client enhancements. The emblem remains still. Reading and ordinary links work without JavaScript. Event filters, the calendar and gallery reuse the same records as their list/detail views. Media is published only after its rights and public credit are recorded.

## Verification

`npm run check` validates content and checks Astro/TypeScript. `npm test` exercises selectors, registration, query state, date precision, both daylight-saving transitions, calendar serialization and content relationships. `npm run links` checks internal targets and anchors in built HTML. `npm run output:check` checks static output, search, metadata and the current locale gate.

These checks support review; they do not establish accessibility conformance or content approval. Review actual desktop and phone layouts, keyboard behavior, reduced motion and language shaping before a release. Performance measurements need a stated device and network profile; a lab result does not measure field interaction latency.

## Assets and licensing

Font files and their licenses are served locally. The logo master and derivatives preserve the supplied emblem. Photograph rights are separate and may require credits or removal. No analytics, membership form, payment system or private member database is configured by this static site.
