# Ulomis pilot data boundary

This document describes the actual data behavior of the David / ReferAll pilot.

## What the deployed application does

- Runs the participant workflow in the browser.
- Stores pilot state in browser `localStorage`.
- Stores selected file bytes in browser `IndexedDB`.
- Computes SHA-256 hashes in the browser for source-integrity checks.
- Exports JSON packets only after the user deliberately presses an export button.
- Dispatches vendor-neutral browser `CustomEvent` analytics without thread content.
- Provides local export, recovery, and deletion controls.

## What it does not do

- It does not automatically upload thread material.
- It does not connect to email, calendar, CRM, messaging, files, or other live systems.
- It does not call an LLM.
- It does not automatically reconstruct arbitrary real input.
- It does not provide server-side accounts, tenancy, access control, or encrypted cloud storage.
- It does not make consequential decisions or execute the suggested next action.
- It does not provide an authentication boundary for `/pilot/david` or `/pilot/workspace`.

The routes are marked `noindex`, but obscurity is not access control. Safety comes from keeping thread material local until deliberate transfer and from using only redacted, permitted material.

## Local storage limitations

Browser storage is not an encrypted vault provided by Ulomis.

Use the pilot only on a trusted, non-shared device. Anyone with access to the browser profile may be able to inspect locally stored data.

The application attempts to degrade honestly:

- if local state cannot be saved, it displays a warning;
- if an attachment is missing, intake and recovery export fail rather than silently producing an incomplete packet;
- a full recovery file includes locally stored attachments and can be imported later;
- source changes invalidate an old continuity response through ID and SHA-256 checks.

## Deliberate transfer

The participant intake packet may contain:

- baseline measures;
- thread qualification details;
- pasted source excerpts;
- link references;
- selected files encoded inside the JSON packet;
- source metadata and SHA-256 hashes.

The packet is transferred manually. A `mailto:` link opens an email draft but cannot attach the file automatically.

Email is not represented as encrypted client-data transport. Use an agreed secure transfer method when the workflow requires it. Otherwise transfer only material that is lawful, permitted, and appropriately redacted.

## Founder workspace

The founder workspace imports the participant packet locally. Attachment hashes are recalculated and checked before the workspace accepts the packet.

The founder produces a separate prepared continuity packet containing:

- the pilot ID;
- the twelve operational claims;
- classification, confidence, sources, and last-confirmed date for each claim;
- a source manifest containing IDs, kinds, labels, and hashes;
- an explicit statement that the result is founder-assisted and unconfirmed.

The prepared continuity packet does not contain the original attachment bytes.

## Participant confirmation

A prepared continuity file remains a draft until the participant reviews it.

Corrections preserve:

- the original claim;
- correction type;
- corrected operational wording;
- reason, when supplied;
- next-action impact;
- correction timestamp.

Confirmation records one selected next action and the time the participant accepted the state as sufficiently accurate for re-entry.

## Analytics and auditability

Browser events contain only non-content metadata such as:

- pilot ID;
- stage;
- language;
- counts;
- timestamps;
- correction type;
- measured duration;
- continuation decision.

They do not include pasted text, source labels, client details, URLs, filenames, claim wording, or notes.

A local audit log is preserved in pilot state and can be exported separately without source content.

No analytics vendor is configured in this repository.

## Outcome records

The default outcome report contains:

- participant and organization labels;
- anonymous thread label;
- baseline and observed measures;
- correction count;
- explicit continuation decision;
- a boundary stating that one workflow is not proof of repeatability.

The full pilot archive additionally contains source content and attachments. It should be transferred or retained only when deliberately required.

## Deletion

The participant can delete local pilot state and attachments from the browser.

The founder workspace has a separate reset control that deletes the imported packet draft and locally stored attachment bytes on that browser.

Deletion on one device does not delete a packet already downloaded, emailed, copied, or stored on another device. Those copies must be removed by their holder.

## Current pilot suitability

This bounded model is appropriate only for a founder-assisted validation pilot with one operator and one carefully redacted workflow.

It is not production-ready for:

- unredacted sensitive client data;
- multiple organizations or users;
- regulated workflows without a separate assessment;
- automatic integrations;
- server-side collaboration;
- organizational retention, legal-hold, or audit requirements;
- scale without proportional founder attention.

## Return-state and measurement boundary

The participant’s thread state is stored in the browser, not in the URL. Copying `/pilot/david` to another device does not move the pilot. A cross-device return requires deliberate recovery-file export and import.

After participant confirmation, the waiting screen shows only the anonymous thread label and expected return date. It does not reveal the confirmed operational state or selected next action. Those remain sealed until the participant starts the live re-entry timer. This prevents pre-timer exposure from invalidating the measured return.

The baseline is timestamped but self-reported. It is locked before source intake. The outcome report must describe any delta against that self-reported baseline, preserve neutral or negative results, and avoid population-level claims from one workflow.

## Integrity boundary

SHA-256 verification covers pasted text, link references and attachment bytes. The founder workspace re-verifies stored evidence after a reload and blocks continuity export whenever integrity cannot be confirmed.

A hash demonstrates that the transferred material has not changed within this pilot path. It does not prove that the source itself was true, complete, current or lawfully obtained. Those remain human and organizational responsibilities.
## Recovery and deletion integrity

- Recovery exports include a SHA-256 digest of the saved pilot state. Import verifies that digest, every source hash, every attachment hash, and the attachment manifest before replacing existing local evidence.
- Attachment replacement occurs in one IndexedDB transaction after verification.
- A deletion success message appears only after both the pilot state and its local attachment set have been cleared. If either operation cannot be verified, the UI says that local data may remain and directs the user to retry or clear the site storage manually.

