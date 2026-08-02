# Ulomis live-thread pilot finalization report

## Implemented promise path

```text
dedicated participant entry
→ qualifying live thread
→ timestamped re-entry and admin baseline
→ fragmented, redacted source intake
→ deliberate packet export
→ founder-assisted source-backed reconstruction
→ participant correction
→ explicit confirmation
→ interruption boundary
→ live re-entry timer
→ observed admin/re-entry comparison
→ second-thread, revise, or stop decision
```

## Participant-facing closures

- Dedicated `/pilot/david` route instead of the generic public demo.
- Persistent six-step progress model with purpose, effort, next handoff, and data boundary on every step.
- Thread qualification gate tied to a real 2–7 day return window.
- Baseline capture before intervention, including re-entry time, admin time, sources, people, and confidence.
- Low-structure intake for pasted fragments, links, and permitted files.
- Local file persistence, size limits, SHA-256 integrity, recovery, and deletion.
- Excluded material is retained locally but omitted from the transferable intake packet.
- Explicit founder-assisted status and target response time.
- Source-set integrity check before a prepared continuity file can be imported.
- Canonical operational state with objective, current state, latest change, decision, rationale, commitments, dependencies, unresolved items, missing information, owners, contradictions, and next action.
- Claim type, confidence, last-confirmed date, and supporting evidence on every item.
- Material correction controls with preserved history and next-action impact.
- Explicit participant confirmation boundary.
- Persistent interruption and return state.
- Live re-entry timing that survives refresh.
- Transparent positive, neutral, and negative metric deltas.
- Local non-content audit log and explicit continuation decision.
- Full English/Arabic copy on the participant path.

## Founder-facing closures

- Local `/pilot/workspace` route.
- Intake packet and attachment-integrity validation.
- Baseline and source review.
- Structured authoring of all twelve continuity fields.
- Mandatory evidence, type, confidence, and last-confirmed date.
- Prepared continuity export explicitly marked founder-assisted and unconfirmed.
- Local draft persistence, attachment opening, reset, and deletion.

## Honest remaining boundary

The pilot is operationally usable with meaningful founder support. It is not an autonomous Living Context Engine.

It still does not provide:

- automatic real-world ingestion;
- model-based extraction;
- server-side persistence or collaboration;
- authentication or organization tenancy;
- encrypted cloud storage;
- automatic status synchronization between participant and founder;
- repeatability, adoption, or commercial proof before real use.

These are intentionally not implied in the interface.

## Verification status

Completed in this environment:

- Pilot-specific strict TypeScript check using external-module shims.
- TypeScript/TSX syntax transpilation across the source tree.
- Static pilot-readiness verifier covering stages, metrics, data boundaries, integrity controls, provenance, correction, timing, recovery, auditability, and decision gates.
- Existing invariant verifier retained.

Blocked in this environment:

- `npm install` through the configured internal registry returned HTTP 404 for `@eslint/js`.
- Direct public-registry installation timed out.
- Therefore actual repository lint and production build still require execution in a normal package-registry environment.

Required before inviting David:

```bash
npm install
npm run verify:invariants
npm run verify:pilot
npm run lint
npm run build
```

Then complete the full deployed dry run in `PILOT_OPERATOR_RUNBOOK.md`.

## Final sociotechnical hardening

The final closure pass additionally enforces:

- the exact ReferAll outreach promise is reflected on the first pilot screen;
- David is explicitly told this is use, not a product-design or general-feedback session;
- the baseline is immutable once source intake begins;
- baseline admin time cannot exceed total baseline re-entry time;
- the confirmed operational state and next action are hidden while waiting, so David cannot see the result before starting the return timer;
- a copied URL is explicitly distinguished from portable state; return requires the same browser/device or a recovery import;
- target delivery includes a visible timestamp and an obligation to communicate any change before it;
- all pasted, linked and attached source material is hash-verified in the founder workspace;
- the founder cannot export a continuity file unless evidence integrity is currently verified;
- re-importing a revised continuity file clears stale corrections and requires fresh confirmation;
- removing the next action blocks confirmation rather than silently restoring the original suggestion;
- actual admin time is constrained to the observed re-entry window;
- positive, neutral and negative re-entry, admin, source and contact deltas receive semantically accurate labels;
- results identify the baseline as timestamped and self-reported;
- finalization locks the outcome controls against post-finalization edits;
- material corrections are counted separately from “looks right” confirmations;
- mobile retains the English/Arabic switch;
- participant-visible fallback, provenance and correction language is bilingual;
- transfer risk is acknowledged before export, including the creation of a separate copy and the limits of email transport;
- continuity import remains disabled until the participant records that the intake packet was actually sent;
- “Something is missing” cannot be submitted without the missing operational state being supplied;
- progression and back-navigation arrows mirror correctly in Arabic RTL;
- participant-facing recovery and failure messages remain actionable in both languages;
- the founder role is represented as evidence preparation rather than visual “AI magic”;
- recovery and founder-workspace imports verify every attachment before replacing any prior local evidence, then replace the pilot attachment set in one IndexedDB transaction;
- source-integrity generation and waiting-screen recovery export now fail visibly rather than producing unhandled browser errors;
- recovery files include a SHA-256 state integrity check and are rejected when state, source, attachment, or manifest integrity does not match;
- participant and founder deletion report success only after the relevant browser state and local file deletion can be verified; otherwise the UI warns that local data may remain;
- returning before the participant-selected date requires an explicit acknowledgement, is recorded in the audit trail, and marks the outcome as weaker interruption evidence rather than a normal 2–7 day re-entry test;
- the measured outcome includes the actual sealed interruption duration;
- returning to intake warns that a previously sent packet may become stale; any source or consent change clears sent/prepared status, derived continuity, corrections, confirmation, re-entry, and result state;
- every newly prepared packet explicitly requires a fresh recorded send before continuity can be imported;
- participant provenance can open or download the underlying local evidence; links and attachments accessed during re-entry are counted once automatically, while other reopened sources remain a separate manual count;
- local attachments are hash-verified again before participant access;
- `/pilot/` is disallowed in `robots.txt` in addition to route-level `noindex` metadata.

See `PILOT_CLAIM_DELIVERY_MATRIX.md` for the exact mapping from each outreach phrase to mechanism, evidence and failure boundary.
