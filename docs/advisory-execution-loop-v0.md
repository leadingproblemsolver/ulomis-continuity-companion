# Advisory Execution Loop v0

## Purpose

Turn guidance from a mentor/advisor/operator into an externally testable action loop:

advisor guidance → explicit action → deadline + success criteria → attempt → evidence / receipt → state change → next-session brief

This is not a CRM and not a note-taking system. The system exists to prevent advice from disappearing into chat history.

## Core objects

- advisor — the person giving guidance.
- session — one interaction or message exchange.
- action — the concrete intervention extracted from that guidance.
- attempt — one execution attempt against the action.
- receipt — observable evidence from the attempt.
- brief — a deterministic next-session summary of what changed.

## v0 acceptance criteria

1. A message from an advisor can be captured through an n8n webhook.
2. The capture creates a session and at least one concrete action in Supabase.
3. Every action has owner, status, next step, success criteria, and due date or explicit no-date state.
4. An outcome can be posted through a second webhook.
5. The outcome records attempt status, evidence, observed result, what changed, and next transition.
6. A next-session brief is generated from database state without inventing facts.
7. The brief separates completed, failed, waiting, open, evidence received, and unknowns.
8. No action is marked successful without an attached receipt or explicit human confirmation.

## Initial real use

Advisor/contact: Mr. Kwasi
Initial ask: identify the most immediate concrete intervention for rebuilding execution and GTM traction.
Expected output: one specific next step, referral, correction, or operating intervention.
Expected behavior from us: execute the advice, record the result, and follow up with evidence rather than another abstract status update.

## Non-goals for v0

- automated LinkedIn scraping
- autonomous message sending
- generic CRM features
- scoring mentors
- LLM-generated factual claims
- multi-tenant auth
- dashboards
- analytics

## State model

OPEN → IN_PROGRESS → WAITING_EXTERNAL → DONE | FAILED | KILLED

An action may only enter DONE when receipt_required = false or at least one receipt exists.

## Next-session brief format

Advisor:
Last interaction:
Advice received:
Action committed:
Observed result:
Evidence:
What changed:
Still unknown:
Next question / ask:
Next irreversible transition:

The next-session brief is the system's primary output.