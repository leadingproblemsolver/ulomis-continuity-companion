# Ulomis proof ledger

**Continuity → real first value → acquisition evidence**

This file is the reviewer-facing record of what Ulomis has become, what has actually been proved, what remains unproved, and which external consequence is being pursued next. It is deliberately stricter than a product narrative: claims are separated by evidence state.

## Evidence states

- **VERIFIED-IN-REPO** — the implementation or artifact exists on the named repository branch and can be inspected.
- **AUTOMATED-CHECK-DEFINED** — an executable check exists, but a passing run has not yet been recorded in this ledger.
- **BROWSER-VERIFIED** — the executable browser check completed successfully and produced a receipt/artifacts.
- **EXTERNAL-ATTEMPTED** — a real message/request was sent to a person or organization outside the project.
- **EXTERNAL-RESPONSE** — the recipient replied, opted in, supplied a thread, used the flow, or otherwise changed behavior.
- **HISTORICAL-PROOF** — a prior artifact, application, deployment, or market interaction exists, but it does not by itself prove current product value.
- **UNVERIFIED** — a useful claim or hypothesis still lacks direct evidence.

---

## 1. Observable target state

A new visitor with one unfinished real-world thread can, before signup:

1. paste **3–20 redacted lines** from a real message/note/session/decision;
2. press **Restore my thread locally**;
3. receive a source-linked continuity packet containing only what the input supports:
   - where the thread was left;
   - explicit decisions;
   - explicit open loops;
   - an explicit next action, when present;
4. see **not found** rather than a fabricated answer when the input does not support a field;
5. correct/add source material or copy the packet;
6. reach this first result on desktop and mobile without signup.

The acquisition loop is not complete until an external operator is asked to use this with a real redacted thread and there is a receipt of what happened.

## 2. Current reality before this proof branch

The `claude/ulomis-landing-demo-3j35cb` branch already had a strong **guided simulated continuity journey**:

- recognition of context loss;
- scattered evidence fragments;
- restoration into current state / change / decision / open loop / next action;
- inspectable evidence;
- uncertainty correction;
- contradiction resolution;
- visitor-selected continuation;
- three scenarios (`work`, `life`, `household`);
- analytics for the simulated first-value funnel;
- Arabic/English support through the journey;
- a real-thread handoff UI.

The critical gap was that the real-thread handoff stopped at echoing back the visitor's text. It explicitly did **not** reconstruct anything. That was truthful, but it meant the product's strongest external claim still depended on simulated data.

**Evidence state:** VERIFIED-IN-REPO in the parent branch via `docs/journey-gaps.md`, `RestorationJourney.tsx`, and the pre-change `RealThreadHandoff.tsx`.

## 3. What this branch adds

Branch: `agent/ulomis-acquisition-proof`

### 3.1 Browser-local real-thread extractor

`src/lib/firstValue.ts` adds a bounded deterministic extractor that:

- splits the visitor's own text into inspectable source fragments;
- detects only explicit state, decision, open-loop, and action language;
- supports a small English/Arabic vocabulary;
- links each surfaced item to the exact source fragment;
- does not summarize with an LLM;
- does not upload content;
- does not infer an unsupported next action;
- emits `Not found` / `No explicit … detected` where evidence is absent.

This is intentionally narrower than the eventual context engine. Its job is to make the first value **real, falsifiable, inspectable, and safe to test now**.

**Evidence state:** VERIFIED-IN-REPO.

### 3.2 Exact first-value action

The post-demo real-thread scene is now a real first-value action, not an intake placeholder.

**Input**

> 3–20 lines from a real unfinished thread. Best input contains a decision, something still open, or a next step. Redaction is encouraged.

**Action**

> **Restore my thread locally**

**Output**

> **Your first continuity packet** — Where you left it / Decisions / Open loops / Next action, each grounded in the visitor's own text.

**Correction**

> **Correct or add a source**

**Portable value**

> **Copy continuity packet**

**Boundary shown in UI**

> The pass runs in the browser with bounded rules. Nothing is uploaded or sent to an AI model.

**Evidence state:** VERIFIED-IN-REPO.

### 3.3 Acquisition deep entry

`/?start=real-thread` bypasses the marketing/guided journey and opens the real-thread first-value test directly.

The page states:

> **One real thread. One result before any signup.**

This exists so an acquisition message can point to the exact value test rather than asking a prospect to understand the full product first.

**Evidence state:** VERIFIED-IN-REPO.

### 3.4 First-value telemetry

The branch adds:

- `real_thread_first_value_completed`
- `real_thread_packet_copied`

The first event records bounded, non-content metadata: character count, number of source fragments, number of matched source fragments, decision/open-loop counts, and whether an explicit next action existed.

**Evidence state:** VERIFIED-IN-REPO.

---

## 4. Why this is differentiated

The immediate comparison is not “does Ulomis summarize text better?” The test is whether it makes **returning to an interrupted responsibility cheaper and more reliable**.

The differentiators currently embodied in the proof are:

1. **Continuity state, not generic summary.** The output schema is constrained to state, decisions, open loops, and next action.
2. **Evidence remains inspectable.** Every extracted item points to the source fragment that caused it to appear.
3. **Unsupported state stays unsupported.** A missing next action is reported as missing rather than invented.
4. **Value before identity.** The real-thread path does not require signup before the first packet.
5. **Correction is part of the product contract.** The visitor can return to the source input instead of treating generated state as authoritative.
6. **The current real-thread proof is private by construction.** The extractor runs in the browser and makes no AI/backend call.

What this does **not** prove yet:

- multi-source ingestion across real apps;
- persistent longitudinal memory;
- semantic reconstruction beyond explicit wording;
- cross-session compounding value;
- production-grade privacy/security beyond the browser-local proof;
- willingness to pay.

Those remain UNVERIFIED.

---

## 5. Acquisition wedge chosen for this test

### Primary actor

A recurring-session operator who has to resume another person's state: initially a **one-to-one tutor / tutoring centre**.

### Trigger

A tutor is about to prepare for or begin the next session after time has passed since the previous interaction.

### Current workflow

Re-read notes/messages, remember what was decided, identify what remains unresolved, and reconstruct what should happen next.

### Failure

The session restarts from memory or scattered notes rather than from a trustworthy handoff state.

### Consequence to test

Preparation/reconstruction time, repeated questions, missed commitments, and weaker continuity between sessions.

### Why this wedge now

The underlying Ulomis mechanism remains general-purpose digital-life continuity. Tutoring is being used as the **first acquisition experiment**, not as a permanent rebrand, because recurring sessions make the before/after behavior observable:

`previous session → time gap → return → reconstruction → next action`

That gives a tighter falsification loop than targeting “busy consumers” generically.

### First acquisition hypothesis

> If a recurring-session tutor supplies one redacted handoff/thread, a source-linked continuity packet can reduce the amount of manual reconstruction needed before the next session enough that the tutor asks to use it again.

### Kill / downgrade condition

If operators can already resume from their current notes in seconds, or the packet does not change their next-session preparation/behavior, tutoring should not remain the priority wedge.

---

## 6. High-relevance input used for browser proof

The automated proof deliberately uses a tutoring-session handoff rather than lorem ipsum:

```text
Current status: We completed the diagnostic and the learner is comfortable with fractions.
We decided to focus the next session on algebra word problems.
We are still waiting for the parent to confirm Thursday's time.
Next I need to send two practice questions before the session.
```

Expected observable output:

- current state from the diagnostic line;
- the algebra-word-problems decision;
- the unresolved parent confirmation;
- the explicit “send two practice questions” next action;
- a `real_thread_first_value_completed` event.

This input is synthetic but domain-realistic. It tests the mechanism; it is **not** user proof.

---

## 7. Browser/mobile verification contract

Files:

- `scripts/browser-proof.mjs`
- `.github/workflows/acquisition-proof.yml`

The browser proof checks the direct first-value path at:

- 1280 × 800 desktop;
- 390 × 844 mobile;
- 320 × 700 small mobile.

It fails if any viewport has:

- horizontal overflow;
- browser/page console errors;
- no visible continuity packet;
- missing decision/open-loop/next-action evidence;
- no `real_thread_first_value_completed` event.

A successful run produces:

- three full-page screenshots;
- `proof/browser/results.json` with the tested viewport/result/event receipt;
- a GitHub Actions artifact named `ulomis-browser-proof`.

**Evidence state at document creation:** AUTOMATED-CHECK-DEFINED. Promote to BROWSER-VERIFIED only after a passing run is observed and recorded below.

### Verification receipt

| Date | Commit/run | Desktop | 390px | 320px | Artifact | State |
|---|---|---:|---:|---:|---|---|
| 2026-08-19 | proof harness created | — | — | — | workflow defined | AUTOMATED-CHECK-DEFINED |

---

## 8. External acquisition attempt ledger

The external attempt is deliberately **manual before automated**. The ask is not “join my waitlist”; it asks one operator for one redacted thread so the first-value mechanism can be tested against reality.

### Message contract

- observation about their recurring-session workflow;
- one sentence explaining Ulomis as continuity rather than generic AI;
- bounded input: 3–20 redacted lines;
- exact return: source-linked state / decisions / open loops / next action;
- uncertainty boundary: unsupported items stay “not found”;
- one low-friction ask: try it on one session.

### Receipt

| Date | Target | Channel | Ask | Delivery | Response / behavior | Evidence state |
|---|---|---|---|---|---|---|
| 2026-08-19 | selected recurring-session tutoring operator | email | one redacted session thread | not yet recorded | — | UNVERIFIED |

The row must be updated after an actual send; preparation alone does not count as distribution.

---

## 9. Ulomis progress externalized

This project has moved through a sequence of increasingly testable artifacts rather than one clean linear build. The useful through-line is:

`reality/context ontology → continuity product contract → guided restoration demo → trustworthy correction/evidence → real first value → external acquisition test`

### Product / proof assets accumulated

- **Living Context Engine / context-engine work** — infrastructure-side framing for preserving reality/context across time.
- **Ulomis product contract** — first value before signup; meaningful restoration under five minutes; restored state / unresolved commitments / next-session bundle as acceptable first-value forms.
- **`ulomis-v2-main.zip`** — earlier product implementation branch/artifact.
- **`engine_proof.jsx` + `engine_proof_mve_package.zip`** — explicit engine/proof embodiment.
- **Ulomis Household / Family work** — “stop figuring out where things stand”; messy situation → confirmed/open/owner/finish condition; family continuity as one consumer scenario.
- **Current continuity-companion repository** — consumer-facing category: “Your digital life, continued”; not positioned as a chatbot, second brain, task manager, or productivity coach.
- **Guided restoration journey** — source evidence, delta, decisions, open loops, uncertainty correction, contradiction resolution, continuation choice, three scenarios, and funnel events.
- **Real-thread first-value proof** — this branch: browser-local, source-linked packet from visitor-owned input.
- **F6S Pre-Accelerator application submission** — historical external receipt for Ulomis as a venture/project; useful as proof of externalization, not proof of product adoption.

### Relevant conversation lineage

The following project conversations materially shaped the operating system now embodied here:

- **PROMPT-001** — product/company-site actualization and moving from project toward distribution while retaining ownership/privacy boundaries.
- **RESEARCH-001** — actor / trigger / current workflow / failure / workaround / consequence / owner / fastest primary-data test / kill condition.
- **Monetizable Artifacts Ranking** — productization gap between concept/prototype and usable, measurable operational product.
- **Precise Subreddit Targeting** — ICP formation, distribution constraints, and the move away from channels that generated activity without enough signal.
- **Market-focused Strategy Shift** — fast signal loops in Qatar and forcing concrete market conversations rather than abstract market research.
- **Shipping Strategy Framework** — evidence-led shipping, observer-specific proof, and distribution as a learning system.
- **Logistinfra Execution Mapping** — reality → signals → context → models → decisions → actions → outcomes → evidence → updated reality; operational infrastructure around that loop.
- **REF Externalization Setup** — evidence ledger / project proof / externalization structure; real work must terminate in receipts, capability gain, falsification, or kill.
- **Add Our Twist** — human ownership of problem contract, invariants, failure model, verification, and external consequence while AI accelerates implementation.
- **Ready for First Set** — production pipeline as a replicable system; Distribution → Learning → Product Direction → Iteration.
- **Walkthrough Ulomis Control Plane** — consolidation of Ulomis assets and execution context into a single control-plane view.

This ledger is the repo-level compression of those conversations: it should let an external reviewer understand what survived, what was built, and what evidence exists without reading the chats.

---

## 10. Proof gaps that remain open

The next evidence hierarchy is:

1. **BROWSER-VERIFIED** — first-value action passes desktop/390/320 browser proof.
2. **EXTERNAL-ATTEMPTED** — one relevant recurring-session operator receives the one-thread test ask.
3. **EXTERNAL-RESPONSE** — they reply/opt in or provide a redacted thread.
4. **REAL-THREAD RESULT** — Ulomis returns the packet against their real input, with any unsupported fields visibly absent.
5. **BEHAVIOR CHANGE** — the operator uses the packet to prepare/resume a later session or corrects it.
6. **RETURN USE** — they voluntarily bring a second thread/session.
7. **PAYMENT / INTRO / REFERRAL** — only after repeated value is demonstrated.

Do not replace stages 3–6 with more landing-page work.

---

## 11. Settle

### What changed in reality?

Ulomis no longer needs simulated data to demonstrate its narrowest first value. A visitor can submit a real thread and receive an evidence-bounded continuity packet locally in the browser.

### What evidence now exists?

Repo implementation + direct acquisition entry + telemetry + executable desktop/mobile proof harness + this proof ledger.

### Whose behavior/access changed?

No external operator behavior should be claimed until the acquisition attempt is actually sent and a response/use receipt exists.

### Which assumption is now testable?

That preserving explicit state, decisions, unresolved items, and next action is valuable enough in a recurring-session workflow to change how someone resumes work.

### Next irreversible transition

Send one bounded one-thread test request to a high-relevance recurring-session operator, record the receipt, then stop building until that external event yields a response, falsification, or a clear reason to change wedge.
