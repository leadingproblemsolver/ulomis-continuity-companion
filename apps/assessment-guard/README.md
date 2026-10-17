# Assessment Guard

**Independent student tool. Your instructor and D2L are the source of truth. No automatic sync, no reminders sent by this tool.**

Not affiliated with, approved by, or connected to UDST, D2L, or any course. It does not grant extensions, excuse missed assessments, or replace university systems.

## Problem

A student can miss an assessment because the date lived only in memory, in an unread announcement, or in a calendar entry that was never actually created. Assessment Guard turns "I think the quiz is next week" into an explicit routine: **record a date you checked → say where you checked it → export it to your calendar → confirm it arrived → see what still needs attention.**

## What it does (v1)

- Add, edit, delete, sort and filter assessments. Nothing is pre-filled; no dates are invented.
- Each entry is **verified** (you name the source and what you checked) or **unverified** (visibly flagged everywhere, including the calendar title). "Verified" means _you_ say you checked — the tool cannot check D2L.
- Shows the exact moment and timezone before saving (e.g. `Asia/Qatar (UTC+03:00)`), and rejects impossible dates and times skipped by daylight-saving changes.
- Risk states with text and symbols (never colour alone): passed, within 24 h, within 48 h, within 7 days, later — plus "unverified", "not yet confirmed in your calendar", and "changed after export".
- Exports standards-compliant `.ics` (RFC 5545: escaped text, 75-octet line folding, stable `UID`, `SEQUENCE` bumped on edits, UTC times). Each event **requests** alerts 7 days, 48 h and 24 h before; calendar apps may ignore them.
- After export, an **"Exported is not the same as imported"** checklist, and a button to record that you confirmed the event is in your calendar.
- Grade scenarios using the INFS1101 master-syllabus weights (final 35, midterm 20, labs 10, quizzes 15, tests 20; pass 60). Empty means _not known_ — never zero. A "midterm counted as 0" scenario exists only as an explicit button and is labelled as a scenario.
- JSON backup and restore with schema checks; restore merges and never overwrites.
- Synthetic demo mode (course `DEMO101`, every item labelled `SYNTHETIC`), never saved.

## Non-goals

No D2L access or scraping, no sign-in, no backend, no server storage, no push/email/SMS reminders, no calendar sync, no grade access, no AI, no institutional branding.

## 2-minute instructions

1. Open the page. Read the yellow-edged notice.
2. Open the official announcement (D2L or instructor email). Copy the date and time into **Date and time**. Check the line under it shows the right day and timezone.
3. Choose **Yes — I checked it myself**, pick where you checked, and type the announcement title or email subject. (Not sure yet? Choose **Not yet** — it will be flagged as unverified.)
4. Press **Save assessment**.
5. Press **Export to calendar (.ics)**, open the downloaded file, and import it into your calendar.
6. In your calendar, check the time and the reminders. Then press **I checked it is in my calendar**.
7. If a date changes: **Edit** it here, export again, and update or delete the old calendar event yourself.
8. Use **Download backup** now and then — the data lives only in this browser.

## Privacy

All data stays in this browser's `localStorage` on this device. Nothing is transmitted. Clearing browser data, private browsing, or changing device loses it — keep a backup. Do not enter health, family, or other personal details; the tool never asks for them.

## Accessibility (low vision)

- Text size control: Standard, 150%, 200%. Everything is sized in `rem`, so browser zoom also works.
- Reflows to 320 px wide at 200% text with no horizontal scrolling (tested).
- Semantic headings, labelled fields, error summary that receives focus and links to each field, `aria-invalid` + `aria-describedby` on errors, `aria-live` status messages.
- Thick high-contrast focus ring; skip link; all actions keyboard-operable.
- Status is always written in words with a symbol, not colour only.
- Automated axe-core WCAG 2.1 A/AA scan: 0 violations in the smoke run. **Not yet tested with a human screen-reader user (NVDA/VoiceOver) or a low-vision user** — see Limitations.

## Run locally

No dependencies. Needs Node 20+ for tests only.

```bash
cd apps/assessment-guard
python3 -m http.server 8080          # or any static server, then open http://localhost:8080
npm test                             # unit tests in Asia/Qatar, America/New_York and UTC
npm run check                        # syntax + bundle check
npm run build                        # dist/assessment-guard.html — single self-contained file
NODE_PATH=/path/to/node_modules npm run smoke   # real-browser test (needs playwright + chromium; axe-core optional)
```

Opening `index.html` directly from disk will not work (ES modules); use a static server or the built single file.

## Tests

| Area                                                                                                                           | How                                     | Result (2026-10-17) |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------------- |
| Validation, duplicates, injection, malformed storage/import                                                                    | `npm test` (node:test)                  | pass                |
| Time-state boundaries (fixed clock)                                                                                            | `npm test`                              | pass                |
| Timezone conversion (Asia/Qatar), DST gap rejection (America/New_York)                                                         | `npm test` under 3 TZs                  | pass                |
| ICS escaping, folding, UID/SEQUENCE, alarms, round-trip parse                                                                  | `npm test`                              | pass                |
| Grade math (0 + 75% ⇒ 60%; all 100 ⇒ 100%; impossible; target >100)                                                            | `npm test`                              | pass                |
| Real browser user journey, reload, export download, edit-after-export, delete, restore, demo, keyboard, 320 px @200%, axe-core | `npm run smoke` (headless Chromium 141) | 21/21 pass          |
| Import of exported `.ics` into Google Calendar / Apple Calendar / Outlook                                                      | manual                                  | **UNTESTED**        |
| Human screen-reader pass (NVDA, VoiceOver, TalkBack)                                                                           | manual                                  | **UNTESTED**        |
| Real low-vision user session                                                                                                   | manual                                  | **UNTESTED**        |

Manual calendar test still to do: export one synthetic event, import it into each calendar app, confirm the start time matches the entered local time and that the three reminders appear (or note which app drops them).

## Limitations

- Data is per-browser and per-device; no sync.
- Calendar apps may ignore imported reminders; editing here never changes an already-imported event.
- `SEQUENCE`/`UID` make re-imports _eligible_ to update the old event in some apps, but this is not guaranteed — the UI tells you to update the old event yourself.
- Grade weights are from the master syllabus; a section may use different rules.
- Screenshots in `docs/screenshots/` use synthetic demo data only.

## Provenance

Started from a single-file prototype (`infs1101_assessment_guard.html`). Rebuilt with tested pure logic (`src/core.js`) and a DOM layer (`src/app.js`). Bugs fixed relative to the prototype: no ICS line folding, no `SEQUENCE`, `localStorage` writes could throw, midterm defaulted to 0, no edit, no verified/unverified distinction, no timezone preview or DST check, no backup/restore, colour-carried status. Course mapping: [`docs/INFS1101_CLO_MAPPING.md`](docs/INFS1101_CLO_MAPPING.md).

Lives in `apps/assessment-guard/` of the Ulomis repository as a fully isolated app: it imports nothing from Ulomis, shares no storage keys or data, and is not wired into the Ulomis router or pilot routes.
