# Ulomis Continuity Companion

Continue this existing project. Do not rebuild working components or change the product concept unless explicitly instructed.

Build Ulomis (oo-LO-miss / أولوميس), a consumer continuity companion.

Positioning:

- Product: Ulomis (أولوميس)

- Category: A continuity companion for your digital life

- Tagline: Your digital life, continued.

- Brand hook: Ulomis keeps the thread.

- Core result: users return to a plan, project, conversation, or responsibility without reconstructing everything from memory.

Ulomis is not:

- an AI assistant;

- chatbot;

- second brain;

- task manager;

- productivity coach;

- robot servant.

Create a reusable design system:

- Primary blue: #315FDD

- Quiet sky: #AFCBFF

- Warm white: #F8FAFD

- Midnight: #10182B

- Confirmed aqua: #7ADBCB

- Open-loop amber: #E6AE5C

- Correction coral: #E37D79

- Primary text: #172036

- Secondary text: #667089

Create Ulomis as an abstract mascot made from one continuous ribbon:

- calm rounded silhouette;

- small central light;

- two minimal eyes only when useful;

- no mouth by default;

- no robot parts;

- no childish styling;

- the ribbon can connect interface fragments;

- recognizable at app-icon size.

Create reusable components for:

- header;

- buttons;

- cards;

- section containers;

- Ulomis mascot states;

- forms;

- scenario selector;

- continuity output;

- trust principles.

Support light and dark mode globally and persist the preference.

Acceptance gates:

- one coherent visual system;

- Ulomis and the product feel inseparable;

- no neon AI aesthetic;

- responsive from 320px upward;

- no fake metrics, testimonials, integrations, or security claims.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7f425ec3-f03f-4dec-bdde-2adda930eebf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Current public demo

The homepage is a no-signup, bilingual continuity-restoration journey rather than a static product brochure.

It demonstrates one shared mechanism across Work, Life, and Household:

```text
scattered fragments
→ visible restoration
→ state delta
→ provenance
→ uncertainty review
→ correction
→ updated next action
→ continuation
```

The demo is deterministic and uses clearly labeled simulated fragments. It does **not** access live email, calendar, messages, files, or other applications. The real-thread handoff remains local to the browser and does not claim to analyze arbitrary user content.

Implemented customer-facing controls include:

- complete English and Arabic journeys with LTR/RTL switching;
- light and dark mode;
- source and timestamp visibility;
- fact, inference, stale, and contradiction labels;
- item-level “Why this appeared” evidence;
- correction-driven state and next-action updates;
- meaningful ribbon mascot states;
- reduced-motion behavior;
- responsive layouts from 320px upward;
- vendor-neutral, non-sensitive behavioral events.

## Verification

```sh
npm install
npm run lint
npm run build
```

Manually verify English and Arabic at mobile and desktop widths, keyboard navigation, reduced motion, scenario switching, correction, next-action selection, and light/dark mode.

## User-side invariant closure

The demo now also enforces:

- a complete canonical continuity view, including current state, commitments, dependencies, missing information, owners, provenance, and confidence;
- item-specific evidence for the objective, prior state, current state, and next action;
- distinct correction outcomes for Correct, Partly right, Outdated, Unrelated, and Missing;
- actual browser persistence and resumption of the demonstrated thread;
- functional save, defer, completion, export, and deletion controls;
- defer date and reason preservation;
- locally preserved real-thread drafts with redaction guidance;
- an optional re-entry baseline for assisted real-workflow validation.

Run the invariant verifier after installing dependencies:

```sh
npm run verify:invariants
```

See `USER_SIDE_INVARIANT_AUDIT.md` for implemented versus unproven invariants and `VALIDATION_PROTOCOL.md` for the real-thread, re-entry, second-use, and commercial evidence gates.


## ReferAll live-thread pilot

The repository now includes a dedicated founder-assisted pilot that delivers the exact bounded promise made to David:

```text
/pilot/david
→ qualify one live client thread
→ lock a self-reported baseline
→ add existing fragments
→ export a deliberate intake packet
→ review and correct a source-backed operational state
→ leave the thread sealed
→ return with a live timer
→ record positive, neutral, or negative outcomes
→ choose second thread, revise once, or stop
```

The local operator workspace is:

```text
/pilot/workspace
```

It verifies source and attachment hashes, requires all twelve continuity fields, and blocks export until every claim has evidence, classification, confidence, and a last-confirmed date. The participant-facing route never claims live integrations, server storage, autonomous reconstruction, or automatic file transfer.

Pilot verification:

```sh
npm run verify:pilot
```

Operational documents:

- `PILOT_OPERATOR_RUNBOOK.md`
- `PILOT_DATA_BOUNDARY.md`
- `PILOT_CLAIM_DELIVERY_MATRIX.md`
- `PILOT_FINALIZATION_REPORT.md`

The return test must run on the same browser and device unless David imports a recovery file. The URL itself contains no thread state. The operational state remains hidden on the waiting screen until the re-entry timer begins, preventing pre-timer exposure to the next action.
