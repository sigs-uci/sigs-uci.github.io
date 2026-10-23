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

For a timed occurrence, record start and end with explicit UTC offsets and `timeZone: "America/Los_Angeles"`. Pacific Time changes with daylight saving. Confirm the instants rather than appending PST to every date. For an actual all-day event use `allDay.start` and an exclusive `allDay.end`; do not call a historical date-only record all-day.

Enable `generateCalendarDownload` only for a precise schedule. Set `calendarUpdated` to the real update instant and increment `calendarSequence` when the schedule changes. Calendar downloads are snapshots. They do not promise automatic updates in a subscriber's calendar.

To cancel, keep the URL, set `eventState` to `cancelled`, close registration and explain the change in the public summary. A rescheduled record retains its ID, receives the confirmed instants and uses `rescheduled`. Do not call an elapsed announcement completed without occurrence support.

Historical corrections retain date precision and the archive label. If a room is uncertain, use the supported building or leave it unknown. Keep historical registration links closed. Tests protect the initial archive facts; update those assertions only after an intentional correction or archive addition has been reviewed.

## Update leadership

Edit `src/data/people.json` for stable public names. Roles and Telegram contacts belong to memberships in `src/data/boardTerms.json`. Keep membership IDs in the form `termId:personId`, preserve display order and use the exact approved URL for that term. A repeated person may have a different contact in another term.

For a new current term, mark the old term `former`, add the approved memberships, update `organization.currentBoardTermId` and synchronize `organization.currentBoard` in `src/data/organization.json`. Each term receives a page automatically; previous term URLs remain available. Do not infer continuous membership dates, biographies or portraits. Run validation before previewing both the current and former term pages.

## Attach a photograph

Select an image with publication permission, a public credit and a known event context. Retain permission evidence and the original in controlled storage. Create small web derivatives, strip location metadata, preserve required visible credits and record dimensions. Avoid cropping faces without checking the result.

Add a `MediaRecord` in `src/data/media.json`. Its local `src`, dimensions, focal point, alternative text, caption and credit describe the actual derivative. Mark it published and approved only after the decision has been made. Reference its ID in the event gallery or hero field. Preview the image at narrow and wide widths, test the viewer with Escape and verify focus returns to the opening link. A media record does not itself establish permission.

## Resources and partners

Resource records use official destinations, a factual description, the date checked and an owner role. Recheck a link before changing its review date. Link to current university guidance for health, immigration, housing or financial questions.

Current partner recognition needs a confirmed relationship, permitted identity assets and accurate context. Dated acknowledgments stay historical. Do not add a payment link, sponsorship price or tax claim without an approved arrangement.

## English and Persian updates

Both languages are published. Keep the interface dictionary in `src/i18n/fa.json` in step with new English labels, page descriptions and public-content wording. Prepare translations for review outside the public repository. An English interface string passed to `tr()` without a dictionary entry fails the Persian build with `Missing Persian interface text`. Add the exact English key and its reviewed Persian value. A proper name that retains its Latin spelling needs an explicit identity entry, such as `"Docunight": "Docunight"`. Run tests and the full build: source-message scans alone cannot find every computed label.

Event dates, venue and registration remain in the shared English event record. Team contacts stay in their term memberships. Add reviewed event text to `src/data/eventTranslations.json`, identifying its event, source revision and actual review date. Run `npx tsx scripts/translation-revision.ts EVENT_ID` to get the current English text revision. Record that value only after the reviewer has checked that version. A changed title or summary removes the Persian counterpart until it is reviewed again. Preserve Latin names and contact URLs until an approved Persian spelling exists.

Review new text in both languages, with reciprocal language links and correct `lang="fa" dir="rtl"` markup. Add Persian alternative text and captions when publishing media. Check real paragraphs, half-spaces, mixed Latin text, buttons, search results and Gregorian dates at 320 px. The output check verifies language counterparts and search indexes. Unreviewed copy must not be committed simply because it is excluded from search.

## A failed build or correction

Read the first validation error, correct the named record, and rerun the same checks. Avoid deleting unrelated content to make a build pass. Restore the last working file from Git if needed, then make a new corrective commit. For a live correction, validate and release the corrective commit through the same release gate.

At the annual handoff, assign a technical steward, content owner and Persian reviewer. Confirm at least two organization owners and the organization mailbox recovery route. Review service ownership, dependencies, resource links and current team contacts. Store credentials in the relevant account's secure settings, with recovery access held by the organization.
