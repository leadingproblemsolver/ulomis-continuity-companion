# Supabase

Ulomis's early-access form persists to Supabase Postgres. There is no server
in this deployment — the browser talks to Supabase directly with the
publishable (anon) key, and Row Level Security is what actually restricts it.

## Project

- **Name:** `leadingproblemsolver's Project`
- **Ref:** `bpgoirwntzsrmsemgjcq`
- **Region:** eu-west-1

This project is **shared with an unrelated app** — it already had its own
`profiles` / `attempts` / `reports` schema (a document/report-analysis
product, tied to Supabase Auth) before Ulomis touched it. Ulomis was pointed
at this project deliberately, reusing that app's existing `waitlist` table
rather than creating a new one. Two consequences of that choice:

1. **Don't assume this project is Ulomis-only.** Anything beyond the
   `waitlist` table's `source`, `referral_code`, and the columns documented
   below belongs to the other app — leave it alone.
2. **`waitlist` has no email-uniqueness constraint**, and can't get one,
   because the same email may legitimately appear once for the other app and
   once for Ulomis. Every row is tagged so the two can be told apart.

## `public.waitlist`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Existing primary key, default `uuid_generate_v4()`. |
| `email` | `text not null` | Not unique — see above. |
| `company` | `text` | The other app's column. Ulomis never sets it. |
| `use_case` | `text` | The other app's free-text column. **Ulomis repurposes it** to hold the "Where do you lose context most?" answer — one of the six `CONTEXT_LOSS_OPTIONS` in `src/lib/earlyAccess.ts` — only for rows where `source = 'ulomis'`. |
| `created_at` | `timestamptz` | Existing, default `now()`. |
| `source` | `text` | Added by Ulomis. `null` = predates this column (the other app's rows). Ulomis sets `'ulomis'` on every row it writes. |
| `referral_code` | `text` | Added by Ulomis. Client-generated short code shown back to the signer-upper — not a security token. Unique among non-null values (`waitlist_referral_code_key`, a partial unique index so the other app's `null` rows never collide). |

To see Ulomis's signups only: `select * from public.waitlist where source = 'ulomis'`.

## Row Level Security

`waitlist` already had RLS enabled with one pre-existing policy, which Ulomis
relies on rather than duplicating:

```sql
create policy "Anyone can join waitlist"
on public.waitlist
for insert
to public
with check (true);
```

No `SELECT`/`UPDATE`/`DELETE` policy exists for `anon`, so RLS default-denies
all three outright — the publishable key can add a row but can never read,
change, or remove one, its own or anyone else's. This was verified directly
(not just inferred from the policy definition) by inserting and then
attempting to read back as the `anon` Postgres role in the same session.

This means Ulomis has **no way to detect or prevent a duplicate signup**
beyond the same-device localStorage cache in `src/lib/earlyAccess.ts` — a
second submission from a different browser simply becomes a second row. That
was a deliberate tradeoff to avoid touching the shared policy.

## Migrations applied by Ulomis

Run via the Supabase MCP server against the project above, in this order:

1. `add_ulomis_columns_to_waitlist` — adds `source`, `referral_code`, and
   column comments.
2. `unique_index_waitlist_referral_code` — the partial unique index described
   above.

`supabase migration list` / the dashboard's migration history shows these by
name if you need to re-check what ran.

## Client configuration

The browser needs two build-time env vars (see `.env.example`):

- `VITE_SUPABASE_URL` — `https://bpgoirwntzsrmsemgjcq.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the `sb_publishable_...` key from the
  Supabase dashboard's API settings (not the `service_role` key — that one
  must never reach the browser).

Both are safe to expose publicly; nothing about their secrecy is what keeps
this table safe. RLS is.
