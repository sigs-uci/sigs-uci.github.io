# Editing the SIGS website

Use a local checkout on `main`. Fetch before editing and preserve other people's work. Every file committed to this repository is public, including files that do not appear on the site. Keep attendee information, permissions evidence, administrative records and credentials in controlled storage.

## A normal update

1. Choose the record and check the facts with the content owner.
2. Edit the relevant JSON in `src/data/`. Use [the field templates](content-templates.md).
3. Run `npm run check` and `npm test`.
4. Run `npm run build`, `npm run links` and `npm run output:check`.
5. Start `npm run preview`. Read the changed page on a phone-width screen and with a keyboard. Test its links and any changed search terms.
6. Obtain the relevant content, translation or media review. Inspect the complete diff and stage only the intended files.
7. Commit the coherent change and push normally to `main` after the repository checks pass. A website release is a separate action described in [the release guide](release.md).

Use the established author and committer identity. Keep a commit subject to one line under 50 characters, beginning with a capital and ending without a period. Do not amend, rebase or force-push shared history. If direct access is blocked, keep the work local and contact an organization owner.

## Add or change an event

Add one `EventRecord` in `src/data/events.json` only when its public facts are ready. Reuse its ID and slug for later corrections, cancellation and recap. Check the date, local time, timezone, venue, admission, audience and registration policy before publishing. Put readable admission and audience information in the event's public details; do not infer it from an old poster.

Publication, lifecycle and registration are separate fields. Use `publication: "published"` for a public record. An event may be scheduled while registration is closed. A missing RSVP service is not an open registration form. Use the organization mailbox as the participation route until a real service is configured.

Set `rulesUrl` when the activity has a public rules document. Give the event an approved `heroImage` so its poster appears in the homepage feature and the event URL's sharing metadata. Share the English or Persian event URL; registration and rules links belong on that page.

For a timed occurrence, record start and end with explicit UTC offsets and `timeZone: "America/Los_Angeles"`. Pacific Time changes with daylight saving. Confirm the instants rather than appending PST to every date. For an actual all-day event use `allDay.start` and an exclusive `allDay.end`; do not call a historical date-only record all-day.

Enable `generateCalendarDownload` only for a precise schedule. Set `calendarUpdated` to the real update instant and increment `calendarSequence` when the schedule changes. Calendar downloads are snapshots. They do not promise automatic updates in a subscriber's calendar.

To cancel, keep the URL, set `eventState` to `cancelled`, close registration and explain the change in the public summary. A rescheduled record retains its ID, receives the confirmed instants and uses `rescheduled`. Do not call an elapsed announcement completed without occurrence support.

Historical corrections retain date precision and the archive label. If a room is uncertain, use the supported building or leave it unknown. Keep historical registration links closed. Tests protect the initial archive facts; update those assertions only after an intentional correction or archive addition has been reviewed.

## Update leadership

Edit `src/data/people.json` for stable public names, verified public `linkedinUrl` values and approved portrait media IDs. Roles belong to memberships in `src/data/boardTerms.json`. Keep membership IDs in the form `termId:personId` and preserve display order. Existing term-specific Telegram records remain in the data, while the interface links to verified professional profiles. Missing photos use initials; do not guess a profile or identify an unlabeled portrait by appearance alone.

Prepare headshots as local WebP images with location and identifying metadata removed. Check the person, credit and publication permission before importing a media record. Referenced team portraits appear on the homepage and team pages; they stay out of community albums and media counts.

For a new current term, mark the old term `former`, add the approved memberships, update `organization.currentBoardTermId` and synchronize `organization.currentBoard` in `src/data/organization.json`. Each term receives a page automatically; previous term URLs remain available. Do not infer continuous membership dates, biographies or portraits. Run validation before previewing both the current and former term pages.

## Publish photographs and collections

Select an image with publication permission and supported context. It may belong to a known event or an undated collection. Folder names and filenames do not establish event dates. Retain permission evidence and the original in controlled storage. Create web derivatives and smaller thumbnails, strip location metadata, preserve required visible credits and record dimensions. Avoid cropping faces without checking the result.

Add a `MediaRecord` in `src/data/media.json`. Its local `src`, dimensions, focal point, English and Persian alternative text, caption and credit describe the actual derivative. Use `thumbnail` for a smaller preview and `kind: "poster"` for artwork that should appear in full. Record the photographer's credit when known; otherwise use `Photographer not recorded.` rather than inventing a name or courtesy claim. Keep historical poster times and registration instructions in their original context.

Mark the record published and approved only after the publication decision. Reference its ID in the event gallery or hero field only when that association is supported; otherwise leave `eventId` null. For a collection, add a record in `src/data/mediaCollections.json` with a stable ID, English and Persian title and description, an optional note in both languages, a `coverId`, ordered `mediaIds` and any supported `eventIds`. An undated collection can have an empty event list. Grouping images does not establish a new event or its date.

Preview the collection and its images at narrow and wide widths. Test the viewer with Escape and verify focus returns to the opening link. Check captions, visible credits and image proportions. A media record does not itself establish permission.

## Publish a video

Review the approved clip and its audio. Create an MP4 web derivative and a WebP poster frame, then add a media record with `kind: "video"`, the local `src`, `videoPoster`, actual width and height, and duration in seconds. Include English and Persian alt text, a short caption naming the supported occasion or context, and descriptive text in `transcript`. Put visual detail in alt text and `transcript`; do not guess event names or dates. Use a known videographer credit, or `Videographer not recorded.` when it is unknown. Add the video ID to its collection's `mediaIds`.

Retain the original sound when publishing a recording. Set `audioContent` to match the public file. Use `silent` when no audio track exists; say in both descriptions when the original recording has no sound. Removing audio needs a specific editorial reason and an explicit explanation in both languages. Retain the original recording in controlled storage. If publishing audible speech, provide accurate English and Persian timed WebVTT files through `captions`, and check them against the audio. Both caption tracks are available from the native player in either language version. Describe relevant sounds and visual action without inventing dialogue.

Play every public video from beginning to end. Check duration, poster loading, keyboard controls, mobile playback, the audio label and both language descriptions. Confirm the actual public file has the intended audio before release.

## Resources and partners

Resource records use official destinations, a factual description, the date checked and an owner role. Recheck a link before changing its review date. Link to current university guidance for health, immigration, housing or financial questions.

Current partner recognition needs a confirmed relationship, permitted identity assets and accurate context. Dated acknowledgments stay historical. Do not add a payment link, sponsorship price or tax claim without an approved arrangement.

## English and Persian updates

Both languages are published. Keep the interface dictionary in `src/i18n/fa.json` in step with new English labels, page descriptions and public-content wording. Prepare translations for review outside the public repository. An English interface string passed to `tr()` without a dictionary entry fails the Persian build with `Missing Persian interface text`. Add the exact English key and its reviewed Persian value. A proper name that retains its Latin spelling needs an explicit identity entry, such as `"Docunight": "Docunight"`. Run tests and the full build: source-message scans alone cannot find every computed label.

Event dates, venue and registration remain in the shared English event record. Team roles and historical Telegram contacts stay in term memberships; professional profile links belong to people records. Add reviewed event text to `src/data/eventTranslations.json`, identifying its event, source revision and actual review date. Run `npx tsx scripts/translation-revision.ts EVENT_ID` to get the current English text revision. Record that value only after the reviewer has checked that version. A changed title or summary removes the Persian counterpart until it is reviewed again. Preserve Latin names and contact URLs until an approved Persian spelling exists.

Review new text in both languages, with reciprocal language links and correct `lang="fa" dir="rtl"` markup. Add Persian alternative text and captions when publishing media. Check real paragraphs, half-spaces, mixed Latin text, buttons, search results and Gregorian dates at 320 px. The output check verifies language counterparts and search indexes. Unreviewed copy must not be committed simply because it is excluded from search.

## A failed build or correction

Read the first validation error, correct the named record, and rerun the same checks. Avoid deleting unrelated content to make a build pass. Restore the last working file from Git if needed, then make a new corrective commit. For a live correction, validate and release the corrective commit through the same release gate.

At the annual handoff, assign a technical steward, content owner and Persian reviewer. Confirm at least two organization owners and the organization mailbox recovery route. Review service ownership, dependencies, resource links and current team contacts. Store credentials in the relevant account's secure settings, with recovery access held by the organization.
