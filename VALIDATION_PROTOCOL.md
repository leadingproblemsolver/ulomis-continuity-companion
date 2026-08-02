# Ulomis assisted validation protocol

## Exact participant

Recruit a hands-on operator who personally carries fragmented state across systems and people and can try a lightweight workflow intervention. Do not substitute an executive, recruiter, abstract reviewer, or job poster for the real operator.

Examples include implementation specialists, onboarding operators, customer-success operators, project or proposal coordinators, operations coordinators, founder's associates, and client-delivery operators.

## Bounded pilot

- Duration: approximately two weeks.
- Scope: up to three live workflows.
- Setup: founder-assisted and low effort for the operator.
- First workflow: free or risk-reversed when appropriate.
- Continuation: must test payment, deposit, or internal sponsorship.

## Gate 1 — Real-thread intake

The participant supplies one real current workflow. Identities and sensitive details may be redacted, but the workflow itself cannot be hypothetical.

Capture the baseline before producing the continuity view:

```yaml
baseline:
  expected_reentry_time:
  sources_normally_opened:
  people_normally_contacted:
  state_confidence:
  next_action_confidence:
```

## Gate 2 — Assisted continuity construction

Produce a source-backed continuity view containing:

```yaml
continuity_view:
  objective:
  current_state:
  latest_meaningful_change:
  decisions:
  rationale:
  commitments:
  dependencies:
  unresolved_items:
  missing_information:
  next_action:
  owners:
  sources:
  confidence:
```

The operator should correct only what matters. Do not ask them to configure an ontology or rebuild the history for Ulomis.

## Gate 3 — Re-entry test

After a genuine interruption, measure:

```yaml
outcome:
  actual_reentry_time:
  sources_reopened:
  people_contacted:
  corrections_required:
  next_action_taken:
  duplicated_work_avoided:
  followups_avoided:
  coordination_steps_avoided:
```

The primary question is whether the maintained state changed or materially simplified what the operator did next.

## Gate 4 — Adoption evidence

Evidence strength:

```text
real workflow
→ correction
→ successful re-entry
→ second live workflow
→ payment or internal sponsor
```

Praise, demo completion, waitlist submission, and concept interest do not advance the adoption gate.

## Stop conditions

Stop or narrow when:

- the first workflow creates no material reduction in reconstruction;
- corrections require more effort than the operator's normal workaround;
- the operator still has to reopen the same sources or ask the same people;
- the continuity view does not alter or simplify the next action;
- there is no second live workflow;
- the product becomes another tracker the operator must maintain.

## Commercial boundary

Working price ranges remain hypotheses only:

- assisted individual use: USD 75–200;
- small-team pilot: USD 300–1,000.

No price is validated until someone pays, deposits, or sponsors the pilot internally.
