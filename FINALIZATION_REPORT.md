# Ulomis user-facing finalization

## Implemented

- Replaced the brochure homepage with a no-signup continuity-restoration journey.
- Added three data-driven scenarios using one shared mechanism: Work, Life, and Household.
- Added scattered source fragments before restoration.
- Added a visible previous-state → changed-state → open-loop → next-action view.
- Added item-level provenance and “Why is Ulomis showing this?” evidence.
- Added confidence, inference, stale-source, and contradiction labels.
- Added a deterministic correction flow that changes the reconstructed state and next action.
- Added explicit continuation and next-action selection.
- Added a truthful real-thread handoff that remains local and does not fake analysis.
- Added full English/Arabic copy, persistent language selection, RTL/LTR switching, and Arabic typography.
- Added functional mascot states for fragmentation, gathering, connection, uncertainty, contradiction, correction, restoration, and continuation.
- Added restrained scroll/state transitions with reduced-motion fallbacks.
- Preserved light/dark mode and mobile responsiveness.
- Added vendor-neutral, non-sensitive behavioral events.
- Updated metadata and README to describe actual capability boundaries.

## Validation completed in this environment

- TypeScript/TSX syntax transpilation passed for all source files.
- A strict type check passed for the modified application surface using local module shims.
- All three scenario schemas passed integrity checks.
- All provenance references resolve to existing source fragments.
- Every localized scenario and global-copy field contains both English and Arabic values.

## Environment limitation

`npm install`, `npm run lint`, and `npm run build` could not be completed in this environment because the configured package registry returned missing packages and direct npm registry access timed out. No successful production-build claim is made here.

Run in a normal networked environment:

```sh
npm install
npm run lint
npm run build
```

Then manually verify English/Arabic desktop and mobile, keyboard navigation, reduced motion, correction-driven state changes, scenario switching, and light/dark mode.

## User-side invariant hardening pass

A subsequent audit against the full Ulomis invariant registry closed additional integrity gaps:

- Added current state, commitments, dependencies, missing information, and owners to the canonical continuity artifact.
- Attached direct provenance controls to objective, previous state, current state, and suggested next action.
- Added distinct state and next-action outcomes for all five correction choices.
- Replaced notification-only save, defer, and complete controls with persistent state transitions.
- Added preserved return state, defer date/reason, JSON export, and local deletion.
- Added locally persisted real-thread drafts, redaction guidance, CSV support, and assisted-trial packet export.
- Added optional baseline fields for real re-entry measurement.
- Added `scripts/verify-user-invariants.mjs`, `USER_SIDE_INVARIANT_AUDIT.md`, and `VALIDATION_PROTOCOL.md`.

The product still makes no claim of arbitrary real-thread reconstruction, measured re-entry reduction, repeated-use adoption, or commercial proof. Those remain real pilot evidence gates.

## Verification for the invariant hardening pass

Completed in this environment:

- `npm run verify:invariants` passed using the available TypeScript runtime.
- All 72 TypeScript/TSX files passed syntax transpilation.
- The modified journey, data model, controls, analytics, and support components passed a strict TypeScript check using local external-module shims.
- All three scenarios passed source-reference, correction-outcome, canonical-field, and English/Arabic completeness checks.

Attempted but blocked by the execution environment:

- `npm install --ignore-scripts --no-audit --no-fund` failed because the configured internal registry returned HTTP 404 for `@eslint/js`.
- Consequently the repository's actual `npm run lint` and `npm run build` commands still require execution in a normal package-registry environment before deployment.

## ReferAll live-thread pilot

The repository now also includes the finalized David / ReferAll workflow at `/pilot/david` and the local operator workspace at `/pilot/workspace`.

The pilot closes the gap between a public product demonstration and the actual outreach promise by providing:

- a qualifying real-thread gate;
- immutable timestamped self-reported baseline;
- deliberate redacted evidence transfer;
- founder-assisted source-backed reconstruction;
- correction and participant confirmation;
- sealed interruption state;
- live re-entry timing;
- admin, source, contact and confidence comparison;
- explicit second-thread, revise-once or stop decision.

See `PILOT_FINALIZATION_REPORT.md`, `PILOT_OPERATOR_RUNBOOK.md`, `PILOT_DATA_BOUNDARY.md`, and `PILOT_CLAIM_DELIVERY_MATRIX.md`.
