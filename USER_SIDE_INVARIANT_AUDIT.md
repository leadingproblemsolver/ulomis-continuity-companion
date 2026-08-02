# Ulomis user-side invariant audit

This audit separates what the public MVP now enforces, what remains a real-world evidence requirement, and what belongs to outreach or pilot operations rather than the browser experience.

## Enforced in the current public experience

### Continuity rather than content storage

- The primary unit is a thread, not a file or chat.
- The result is a current operational state, not a generic summary.
- The continuity view includes objective, previous state, current state, meaningful changes, decision and rationale, commitments, dependencies, unresolved items, missing information, next action, owners, sources, and uncertainty.
- Operational details are progressively disclosed so completeness does not become cognitive overload.

### Provenance, uncertainty, and contradiction

- Objective, previous state, current state, changes, decisions, commitments, dependencies, open loops, next actions, and uncertain claims resolve to visible sources.
- Source facts, user-stated meaning, inference, stale context, and contradiction are labeled separately.
- The Household scenario preserves two conflicting source claims instead of silently choosing one.
- The demo never represents generated fluency as evidence.

### Correction and agency

- The user can classify the uncertain item as correct, partly right, outdated, unrelated, or missing context.
- Every correction choice has a distinct state update and next-action outcome.
- The original inference and the correction remain separate records in the visible demo state.
- Ulomis presents the next action as a suggestion; it performs no external action.

### Continuation and return

- The selected scenario, correction, next action, status, and defer details persist in the browser.
- A returning visitor receives a preserved-thread prompt rather than a blank dashboard.
- Save, defer, and complete are real state transitions rather than notification-only controls.
- Defer preserves both a return date and a reason.
- Completion retains history.
- The continuity view can be exported as JSON and local continuity can be deleted.

### Imperfect real inputs without fabricated capability

- A user can paste an unorganized real thread or add a local text, Markdown, JSON, or CSV file.
- The draft is preserved locally across refreshes and can be cleared.
- The interface tells users to redact material they do not want stored on the device.
- The current demo does not claim to reconstruct arbitrary real input or access live applications.
- The user can copy or download an assisted-trial intake packet.

### Cognitive and inclusive operation

- Value appears before authentication.
- Work, Life, and Household use one mechanism rather than separate product experiences.
- The full guided journey exists in English and Arabic, with LTR/RTL switching.
- Reduced-motion users receive the same meaning without motion-dependent comprehension.
- The mascot represents actual system state: fragmented, gathering, connecting, uncertain, contradicted, corrected, continued, completed, or no match.
- Advanced operational details remain collapsed until requested.

### Validation readiness

- Optional baseline fields capture expected re-entry time, sources normally reopened, people normally contacted, and next-action confidence.
- Behavioral events cover restoration, evidence inspection, correction, next-action selection, save/defer/complete, export, deletion, and return.
- Analytics events contain no thread content or sensitive free text.

## Not claimed or proven yet

The following are evidence gates, not additional landing-page features:

- reliable reconstruction of arbitrary real workflows;
- actual reduction in re-entry time on a real thread;
- observable reduction in sources reopened, people contacted, follow-ups, or duplicated work;
- successful re-entry after a genuine interruption;
- adoption through a second live workflow;
- repeated use, referral, payment, deposit, or internal sponsorship;
- compounding organizational memory from repeated real corrections;
- task-specific retrieval across live integrations;
- production-grade durable multi-device persistence;
- autonomous ingestion or action.

None of these may be claimed until measured.

## Operational invariants outside the browser runtime

Recipient-role classification, identity verification, outreach compression, scraper hygiene, operator/sponsor separation, pilot pricing, and commercial proof belong to the field-validation process. They are preserved in `VALIDATION_PROTOCOL.md`; they should not be added as customer-facing product complexity.

## Current irreducible test

A qualified operator should provide one real, possibly redacted workflow and receive an assisted continuity view that lets them resume after interruption with less reconstruction. The test advances only when the operator corrects the state, successfully re-enters, supplies a second workflow, and creates payment or sponsorship evidence.
