# Restoration journey — gap reconstruction

This records what changed and why, against the gap analysis that prompted it
(numbered G01–G17 below, condensed from the original review). Read this
before touching `src/components/journey/` or `src/data/journey.ts`.

## The core problem being fixed

The landing page described continuity instead of demonstrating it: a hero
explained the product, then separate marketing sections argued for it, then
a demo lower down showed a static before/after. Nothing proved the three
things that actually matter — a visible delta, a correctable inference, and
a next action the visitor chooses.

## What was built

`src/components/journey/RestorationJourney.tsx` replaces the old hero +
"Problem recognition" + "Category shift" + demo section with one guided
flow:

1. **Recognition** (`RecognitionScene.tsx`) — a felt statement, no product
   tour, no signup. (G01)
2. **Scattered fragments** — evidence cards with origin, timestamp, and an
   explicit fact/stated/inferred badge (`EvidenceCard.tsx`). Irrelevant
   fragments stay inspectable rather than disappearing. (G06)
3. **Restoration** — the ribbon connects only relevant fragments; the mascot
   state is driven by real product state throughout (`journeyMascot.ts` maps
   the whole journey onto `UlomisMark`'s existing state enum — no decorative
   motion). (G10)
4. **Continuity view** (`ClaimRow.tsx`) — where you are, what changed
   (the delta — this was the single most load-bearing gap, G03), what you
   decided, what's open, next action. Every row's "Why" opens the exact
   fragments it rests on, not a generated explanation. (G13)
5. **Trust test** (`TrustTest.tsx`) — Ulomis surfaces one claim it's
   genuinely uncertain about, with five correction controls (Correct /
   Partly right / Outdated / Unrelated / Something is missing). Applying one
   visibly changes the state — including, when relevant, overriding the
   next action, not just striking through the claim. (G04) A contradiction
   between two sources then appears, and resolving it produces a stated
   outcome, not a silent pick. (G14)
6. **Continuation** (`Continuation.tsx`) — choosing what happens next is the
   first-value event, not just reaching the continuity view. (G07)
7. Post-journey, the strongest CTA is "Give Ulomis one real thread," not a
   generic "Join." (G08)

### Language

`src/lib/i18n.tsx` provides a `Locale`/`dir` context, persisted and applied
pre-paint (same pattern as the existing theme toggle). Every journey string
is a `{ en, ar }` pair (`Bilingual` in `journey.ts`) — a missing translation
is a type error, not a silent English fallback. RTL uses Tailwind logical
properties (`ms-`/`me-`/`ps-`/`pe-`/`text-start`) throughout the journey
components rather than physical left/right, so mirroring is automatic. Sora
and Manrope are Latin-only; Arabic falls back to Tajawal
(`html[dir="rtl"]` overrides in `styles.css`). (G09)

**The Arabic copy is draft.** It was written for this project, not
machine-translated, but has not been reviewed by a native Gulf Arabic
speaker. Treat it as needing that review before it's treated as final.

### Validation funnel

`src/lib/analytics.ts` tracks `journey_scenario_started` →
`journey_restored` → `journey_correction_applied` →
`journey_contradiction_resolved` → `journey_next_action_selected`. (G16)

### What was deliberately left out

No numeric "confidence" score anywhere — the fact/stated/inferred badge
carries that signal qualitatively instead. Inventing a percentage would
violate the site's own "no fake metrics" principle (see
`src/components/landing/EvidenceStatus.tsx`), which predates this change and
still applies.

## What's explicitly deferred, not forgotten

- **Only "My work" is built.** "My life" and "My household" are typed into
  the same `Journey` shape (`src/data/journey.ts`) but not yet written. Adding
  one is: write a second `Journey` object, add it to the `journeys` array,
  build a scenario switcher in `RestorationJourney.tsx` (currently there's
  only one, so no switcher UI exists yet).
- **Real-thread handoff (G08's Scene 8–9)** — pasting or uploading an actual
  unfinished thread. The CTA exists and links to the existing early-access
  form; the low-friction paste/upload flow itself doesn't exist yet.
- **Return-state preview (G15)** — "when you return, Ulomis shows what
  changed" epilogue. Not built.
- **Full 12-section page architecture (G07's complete restructure)** — only
  the hero/demo portion was rebuilt. Benefits, How it works, Trust,
  Philosophy, and Evidence status below the journey are unchanged from
  before this pass, and are **not yet localized into Arabic** — an Arabic
  visitor gets full parity through the journey, then English below it.
- **Auth-after-value framing (G09's Scene 9)** — no auth exists in this
  build at all (see the main README's scope note); out of scope regardless.
