# Deploying to Netlify

Ulomis ships as a fully static site — no server runs at request time. The
only thing that isn't static is the early-access form, which talks straight
from the browser to Supabase using the public/anon key; Row Level Security is
what keeps that safe (see `supabase/README.md`).

## Why a static export, not the framework's own build

This is a TanStack Start app, and its normal production build goes through
Nitro to produce a deployable server bundle — that's what Lovable's own
hosting uses (Cloudflare Workers), and it's untouched by anything below.

Nitro's *own* prerender feature doesn't work here: it rebuilds a separate
server bundle via raw rolldown, outside Vite's environment API, and TanStack
Start's virtual modules (route tree, manifest, server entry) don't resolve
there — every route 404s. So for Netlify we skip Nitro entirely and use
`scripts/build-static.mjs` instead, which calls the SSR bundle Vite already
builds correctly, once, for `/` — the app's only route — and writes the
response as `dist/client/index.html`. From that point on it's a plain static
file: real `<title>`, meta tags, and JSON-LD baked in, no JS required to make
the page meaningful to a crawler or a social-preview bot.

`vite.config.ts` detects Lovable's own sandbox (`LOVABLE_SANDBOX` /
`DEV_SERVER__PROJECT_PATH`) and only skips Nitro outside it, so this doesn't
change how Lovable's own preview/publish works.

## One-time setup

### 1. Connect the repo

Netlify → **Add new site → Import an existing project** → pick this repo and
the branch you want to deploy (`main`, or whichever branch you're shipping
from).

### 2. Build settings

`netlify.toml` already specifies these, so Netlify should pick them up
automatically — listed here so they're not a mystery if you ever configure a
site by hand instead:

| Setting | Value |
|---|---|
| Build command | `bun install && bun run build:static` |
| Publish directory | `dist/client` |

### 3. Environment variables

**Site settings → Environment variables**, add:

| Key | Value | Where to find it |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://bpgoirwntzsrmsemgjcq.supabase.co` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_...` key | Same page — **use the publishable key, never `service_role`** |

Both values are meant to be public — see `supabase/README.md` for why that's
fine here. If these are missing, the build still succeeds, but every
early-access submission fails with "Signups aren't available right now" and
logs a clear console error naming the missing var — it won't fail silently.

### 4. Custom domain

Buy the domain wherever you like — the registrar doesn't need to match the
host. Then in Netlify: **Domain settings → Add custom domain**, and point its
DNS at Netlify (either Netlify's nameservers, or the CNAME/ALIAS record
Netlify gives you for that specific domain).

## Every subsequent deploy

Nothing to do — push to the connected branch and Netlify rebuilds
automatically. There's no manual step, no separate asset upload.

## Verifying a deploy

After it goes live:

1. **View source** on the deployed URL (not just DevTools' rendered DOM) and
   confirm the `<title>` and meta tags are real text, not placeholders — that
   confirms `build-static.mjs` actually ran and produced real prerendered
   HTML, not an empty SPA shell.
2. Run through the interactive demo (`#demo`) — all three scenarios, Confirm
   / Correct / Why / Dismiss.
3. Submit the early-access form with a real address you can check, then in
   the Supabase dashboard's Table Editor confirm a new row landed in
   `public.waitlist` with `source = 'ulomis'`. (You won't see it from the
   browser — the anon key can insert but not read back, by design.)
4. Check both color themes and a couple of viewport widths (320px upward).

## If something breaks

- **Build fails on `scripts/build-static.mjs`** — it throws loudly if the SSR
  bundle returns anything other than a 200 for `/`, or if the response is
  missing the expected `<title>Ulomis` text. Check the Netlify build log for
  the specific error; it's designed not to ship a broken page silently.
- **Early-access submissions don't show up in Supabase** — check the two env
  vars are actually set on the Netlify site (not just in `.env.example`
  locally), and check the browser console for the `[ulomis] early access
  signup failed` log, which includes the underlying Supabase error.
- **This branch is connected to Lovable** — pushing here also syncs back to
  the Lovable editor. Keep it in a working state; avoid force-pushing or
  rewriting history on it.
