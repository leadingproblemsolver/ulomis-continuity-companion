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

`src/lib/analytics.ts` tracks `demo_started` → `restoration_completed` →
`why_opened` → `item_confirmed` / `item_corrected` / `item_dismissed` →
`contradiction_resolved` → `next_action_selected` (+ a one-time
`demo_first_value_completed`) → `real_thread_started`. Also `landing_viewed`,
`scenario_selected`, `language_changed`. Every event is also dispatched as a
`window` `CustomEvent("ulomis:event")` alongside the `window.ulomisEvents`
queue, so anything on the page can observe the funnel without importing the
module. (G16)

### What was deliberately left out

No numeric "confidence" score anywhere — the fact/stated/inferred badge
carries that signal qualitatively instead. Inventing a percentage would
violate the site's own "no fake metrics" principle (see
`src/components/landing/EvidenceStatus.tsx`), which predates this change and
still applies.

## Audit pass against `ulomisjourneygapreconstruction.yaml`

A fuller, formal version of the gap analysis (structured `gap_registry`
G01–G17, `where_you_left_it_view` fields, `validation_events`) was provided
after the build above shipped. Per "roll with it, don't complicate," this
was an audit for cheap, real gaps — not a rebuild against the new document.
Three things were checked and closed; everything else in the spec that
isn't already covered above is a deliberate, documented divergence, not an
oversight.

Closed:

- **Thread title.** The spec's `where_you_left_it_view` names the
  restored thread explicitly. `Journey.title` (`{ en, ar }`) was missing;
  added to the type and to `workJourney`
  (`"Client-launch decision"` / `"قرار إطلاق العميل"`), and it now renders
  above the claim list in `RestorationJourney.tsx`.
- **Dead `why_opened` tracking.** `ClaimRow`'s `onInspect` prop was fully
  built but never called from the parent, so opening a "Why" panel on any
  of the five continuity-view rows fired nothing. Wired `onInspect` on
  every `ClaimRow` in `RestorationJourney.tsx`; the stale
  `journey_uncertainty_inspected` event (declared, never fired anywhere)
  was renamed to `journey_why_opened` to match, since Why panels exist on
  settled claims too, not only the uncertain one.
- **Missing recognition-scene event.** Selecting one of the four felt
  statements in `RecognitionScene.tsx` changed nothing tracked. Added
  `journey_recognition_statement_selected`.

Reaffirmed, not changed:

- **No numeric confidence score.** The formal spec's evidence model still
  implies a gradient of certainty; this build still represents that only
  through the qualitative fact/stated/inferred badge, for the reason
  above. Restated here because the fuller spec makes the omission more
  visible, not because the reasoning changed.

## Full-scope pass: scenario switcher, real-thread handoff, return preview

A later, stricter instruction (the "Artifact-to-Adoption Pipeline" brief)
required the three things the previous pass had deliberately deferred, plus
a functional-mascot and analytics-vocabulary alignment. This section
replaces the "explicitly deferred" list above — those items are now built.

- **Three scenarios, one mechanism (G-scenario).** `src/data/journey.ts` now
  defines `workJourney`, `lifeJourney`, and `householdJourney` — same
  `Journey` shape, same 5–7 fragments / delta / decision / open loop /
  uncertain-item / correction / contradiction / next-action structure for
  each. `ScenarioSwitcher.tsx` is a quiet three-way tab control (not three
  competing products) rendered above the demo card. `RestorationJourney`
  defaults to `work` unless a `?scenario=life|household` query param is
  present — read after mount (not during the initial render) specifically
  so it never causes an SSR/client hydration mismatch. Switching scenarios
  resets only the demo state (stage, correction, contradiction, next
  action); theme and language are untouched, since they live in separate
  contexts.
- **Real-thread handoff (Scene 8).** `RealThreadHandoff.tsx` — a paste
  textarea, an optional local `.txt`/`.md`/`.json` file read via
  `FileReader` (never uploaded), and an optional short label. Content lives
  only in component state. Saving switches to a review view that shows back
  exactly what was entered, states plainly that nothing was read, analyzed,
  or sent anywhere, and offers two truthful next steps: copy what was typed,
  or continue to the real early-access form (`#early-access`). It does not
  fabricate a reconstruction of the pasted content — that would violate the
  "simulated content must be explicitly labeled" invariant.
- **Return preview (Scene 9).** `ReturnPreview.tsx` — a short, static
  epilogue per scenario (`Journey.returnPreview`): previous state → one new
  fragment → what changed → what's still open → the current next action.
  Explicitly not a second demo — no interaction, no restore button.
- **Compact trust strip (Scene 10).** `TrustStrip.tsx` — six one-line
  claims (sources visible, inferences correctable, simulated examples
  labeled, Ulomis suggests/you decide, nothing leaves the browser, no live
  app access), placed near the demo rather than folded into the larger
  `TrustSection`/`EvidenceStatus` sections further down the page, which are
  unchanged and still carry the fuller version of the same claims.
- **Functional mascot contract.** `journeyMascot.ts`'s `JourneyPhase` was
  renamed to the spec's exact vocabulary (`contradicted`, `corrected`,
  `completed`) and gained `no_match` — used specifically when the visitor
  picks "Something is missing" on the uncertain claim, so the ribbon stays
  open rather than resolving to a state that implies an answer exists.
- **Analytics vocabulary.** `src/lib/analytics.ts`'s event names were
  renamed to the required set (`landing_viewed`, `scenario_selected`,
  `demo_started`, `restoration_completed`, `why_opened`, `item_confirmed`,
  `item_corrected`, `item_dismissed`, `contradiction_resolved`,
  `next_action_selected`, `demo_first_value_completed`,
  `real_thread_started`, `language_changed`). The five correction options
  map onto three tracked outcomes: `correct` → `item_confirmed`,
  `unrelated` → `item_dismissed`, everything else (`partly`, `outdated`,
  `missing`) → `item_corrected`.
- **Recognition-scene copy** now matches the brief's exact EN/AR headline
  and includes the required support-copy paragraph, which the earlier build
  was missing entirely (it only had the headline, the four pill statements,
  and the CTA).

## What's still deferred, not forgotten

- **Full 12-section page architecture** — only the journey and the scenes
  immediately around it (recognition through return preview) were rebuilt
  to the brief's exact structure. Benefits, How it works, the full Trust
  section, Philosophy, and Evidence status below the journey are unchanged
  from the earlier pass, and are **not localized into Arabic** — an Arabic
  visitor gets full parity through the journey and its surrounding scenes,
  then English below it.
- **Auth-after-value framing** — no auth exists in this build at all (see
  the main README's scope note); out of scope regardless.
- **Native-speaker Arabic review** — still outstanding for all three
  scenarios, including the two written in this pass.
