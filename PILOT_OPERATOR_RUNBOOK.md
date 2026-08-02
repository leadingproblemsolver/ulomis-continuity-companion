# Ulomis live-thread pilot — operator runbook

This runbook is the operating contract for the David / ReferAll pilot.

The promise being tested is deliberately narrow:

> Configure Ulomis on one live client thread, let the operator correct only what matters, and measure whether admin and re-entry effort are reduced.

The pilot is founder-assisted. The application does not claim autonomous ingestion, live integrations, or arbitrary AI reconstruction.

## 1. Routes

- Participant route: `/pilot/david`
- Founder workspace: `/pilot/workspace`

Both routes are marked `noindex`. Neither route is an authentication boundary. Thread material remains browser-local until the participant deliberately exports it.

## 2. Before inviting David

Run:

```bash
npm install
npm run verify:invariants
npm run verify:pilot
npm run lint
npm run build
```

Then complete one internal dry run from start to finish:

1. Open `/pilot/david` in a clean browser profile.
2. Choose a simulated active thread with a return date 2–7 days away.
3. Record baseline re-entry and admin measures.
4. Add at least two sources, including one file.
5. Export the intake packet.
6. Open `/pilot/workspace` on a trusted device.
7. Import the packet and verify attachment integrity.
8. Complete all twelve continuity claims with evidence, confidence, classification, and last-confirmed date.
9. Export the prepared continuity file.
10. Import it back into the participant route.
11. Correct one material claim and revise the next action.
12. Confirm the thread, export recovery, start re-entry, stop the timer, record the outcome, select a decision, and export the outcome report.
13. Refresh at each stage to verify persistence.
14. Delete the pilot and confirm local state is removed.

Do not invite an external user until this dry run passes in the deployed environment.

## 3. Thread qualification

Accept only a thread that is:

- active now;
- client-facing;
- normally reconstructed from at least two sources;
- still carrying a decision, dependency, follow-up, commitment, or unresolved item;
- expected to be reopened within 2–7 days;
- safe and lawful to share after redaction.

Reject or pause:

- completed or purely archival work;
- synthetic examples;
- a thread with no consequential next action;
- credentials, secrets, special-category personal data, or material the participant is not permitted to share;
- regulated or safety-critical work whose use has not been explicitly scoped.

A rejected thread is not a failed pilot. It is an invalid test case.

## 4. Communication standard

At every handoff, state five things explicitly:

1. **Current status** — what has happened.
2. **Participant action** — exactly what David must do, if anything.
3. **Operator action** — exactly what Ulomis / Salima will do.
4. **Timing** — the recorded target time for the next handoff.
5. **Boundary** — what has not happened and what remains unconfirmed.

Never use vague language such as “we are looking into it,” “AI is processing,” or “the system understands the thread.”

Use:

> Packet received. No action is needed from you. I am reconstructing the objective, current state, decisions, commitments, dependencies, unresolved items, owners, and next action from the material you supplied. I will return the draft continuity file by the time shown in your pilot. Nothing is confirmed until you review it.

If the deadline changes, communicate the new time and reason before the prior deadline passes.

If clarification is necessary, ask one bounded question at a time and explain which claim cannot be completed without it.

## 5. Intake handling

The participant packet is a deliberate manual transfer. Export creates a separate copy. Email does not attach the file automatically and is not an encrypted client-data channel. The participant must acknowledge that boundary before export, and the continuity-return import stays disabled until they record that the packet was actually sent.

Preferred order:

1. Use an agreed secure transfer method when the workflow requires it.
2. Otherwise accept only a redacted, permitted packet.
3. Confirm receipt by pilot ID, not by repeating sensitive thread content.
4. Store the packet only on the trusted device used for the founder workspace.
5. Do not copy source material into unrelated notes, chats, analytics, or task systems.

The participant’s baseline is locked before reconstruction. Do not edit it after seeing the outcome.

If David returns to intake after a packet was prepared or sent, any source or consent change invalidates the prior packet and all derived continuity. He must prepare and send a fresh packet; do not return a continuity file built from a superseded packet.

## 6. Reconstruction standard

The founder workspace requires these twelve fields:

1. Objective
2. Current state
3. Latest meaningful change
4. Decision
5. Rationale
6. Commitments
7. Dependencies
8. Unresolved items
9. Missing information
10. Owners
11. Contradictions
12. Suggested next action

For every field:

- use concise operator language;
- attach at least one source;
- identify the claim type;
- set confidence honestly;
- record the last-confirmed date;
- expose missing information and contradictions;
- preserve why a decision was made;
- do not collapse alternatives into a fabricated conclusion.

Claim types:

- **Source-backed fact** — directly supported by supplied evidence.
- **Participant-stated meaning** — the participant explicitly supplied the interpretation.
- **Inference** — plausible but not directly established; must remain correctable.
- **Suggestion** — a restrained next action; the participant decides.
- **Contradiction** — current sources disagree or cannot both be true.

The next action must follow from the current state. It must not imply that an email was sent, a commitment was made, or a decision was executed.

## 7. Participant review

The participant is not a product consultant. Their task is only to correct operationally material state.

Use this instruction:

> Read only enough to determine whether this would let you resume the work. Correct anything that would change the work, the open loop, or the next action. Leave non-material wording alone.

A confirmed thread must have:

- a source-backed operational state;
- a visible correction record;
- one explicit selected next action;
- a confirmation timestamp;
- a recovery export available.

## 8. Re-entry test

The test occurs after interruption.

David should:

1. Return on the same browser and device, or import the recovery file first. The URL alone contains no thread state.
2. Open the pilot before reopening original sources where practical. The confirmed operational state remains sealed on the waiting screen.
3. Start the timer only when genuinely returning to the thread.
4. Use the continuity view first.
5. Links and local attachments accessed through the evidence panel are counted once automatically; record only other original sources in the separate manual counter, and count every person contacted.
6. Stop the timer when he knows what to do next.
7. Record actual admin minutes and after-confidence measures.

Do not coach the outcome while the timer is running.

## 9. Measurement rules

The product may claim only what the recorded data supports.

Measured directly:

- baseline re-entry minutes;
- observed re-entry seconds;
- baseline admin minutes;
- actual admin minutes;
- sources normally reopened versus actually reopened;
- people normally contacted versus actually contacted;
- state-confidence change;
- next-action-confidence change;
- corrections required;
- next action taken;
- duplicated work, follow-ups, and coordination avoided as participant-reported outcomes.

Retain negative results. Do not clamp them to zero or describe them as savings.

One successful thread is evidence of value in one workflow. It is not proof of repeatability, adoption, or commercial demand.

Decision gate:

- material value → test a second live thread;
- partial value → revise and repeat once;
- no material value → stop this workflow test.

A second live thread is the minimum behavioural test of repeat use. Payment or internal sponsorship is a separate commercial test.

## 10. Failure and recovery

### Browser storage failure

- Export the recovery file immediately.
- Do not claim the state is preserved until the export succeeds.
- If attachments cannot be recovered, re-add them before regenerating an intake packet.

### Source changed after reconstruction

The participant import rejects a continuity file whose source IDs or SHA-256 hashes no longer match. Export a new intake packet and reconstruct again.

### Missing or malformed packet

- Do not infer the missing content.
- Ask the participant to re-export from the same pilot.
- Verify pilot ID and packet kind before proceeding.

### Clarification required

- Name the single field blocked by missing evidence.
- Ask one bounded question.
- Record that the prior target time has changed.

### No reliable current state

Return an explicit missing-information or contradiction claim. Do not produce a confident next action.

### Participant withdraws

- Stop processing.
- Delete local workspace data and attachments.
- Ask the participant to use the in-product deletion control on their device.
- Retain no source content in the outcome record.

## 11. End-of-pilot handoff

Send the non-content outcome report first. Transfer the full archive only when deliberately required.

The final message must state:

- observed baseline and outcome;
- whether the result was positive, neutral, or negative;
- what remained uncertain;
- the explicit second-thread / revise / stop decision;
- that one workflow is not repeatability proof.

Do not ask for generic feedback. Ask only for the selected operational next step.


## 12. Measurement-integrity rules

- The baseline is David’s timestamped self-report, not an independently observed historical measure. Describe it that way in every result.
- Do not change the baseline after source intake begins. Restart the pilot when it is materially wrong.
- Baseline admin minutes must sit within baseline re-entry minutes.
- The waiting screen must not reveal the confirmed state or next action before the live timer starts.
- Returning before the selected date requires an explicit acknowledgement and must be described as weaker interruption evidence, not as the intended 2–7 day re-entry test.
- The outcome report must retain the observed interruption duration and early-return flag.
- Actual admin minutes must sit within the live re-entry window.
- Preserve zero and negative deltas. Do not relabel a slower return, extra source, extra contact or additional admin as a saving.
- Once the outcome is finalized, do not edit it. Restart or document a separate amended record if an error is discovered.

## 13. Evidence-integrity rules

- Verify hashes for pasted text, links and every attachment on import and again after workspace recovery.
- Do not export continuity while integrity is unverified.
- A source link is a reference, not proof that the operator can access its contents. Ask for a permitted excerpt when access is unavailable.
- Every continuity claim must cite at least one source from the transferred manifest.
- Re-importing a revised continuity file requires a fresh participant review; prior corrections must not silently carry over.
