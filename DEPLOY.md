# Deploying to Netlify

Ulomis is a TanStack Start app. On Netlify it deploys as server-rendered
pages via a Netlify Function, with static assets served straight from the
CDN. The early-access form talks directly from the browser to Supabase using
the public/anon key; Row Level Security is what keeps that safe (see
`supabase/README.md`).

## How the build maps onto Netlify

`bun run build` runs Vite, then Nitro. Nitro auto-detects the `netlify`
preset when it sees Netlify's environment, and emits two things:

| Output | Path | Purpose |
|---|---|---|
| Static assets | `dist/public/` | What `netlify.toml`'s `publish` points at. |
| SSR function | `.netlify/functions-internal/server/` | Picked up automatically by Netlify's function bundler. |

The function declares its own routing in code (`path: "/*"` with
`preferStatic: true`, Netlify's Functions v2 config), so **no `_redirects`
rule is needed** — a real file under `publish` wins, and anything else falls
through to SSR. An empty `dist/public/_redirects` in the build output is
expected, not a bug.

### Two things that will silently break this

1. **`publish` must equal `nitro.output.publicDir`.** These are set in two
   different files (`netlify.toml` and `vite.config.ts`) and nothing enforces
   agreement — a mismatch fails the deploy with *"Deploy directory
   'x' does not exist"*. Both are currently `dist/public`.
2. **Don't pin `nitro.output.serverDir`.** `vite.config.ts` deliberately
   overrides only `publicDir`. Setting `output.dir` or `serverDir` pulls the
   server bundle out of `.netlify/functions-internal/`, and the build still
   *succeeds* — it just deploys with no function at all, so every non-static
   request 404s.

`vite.config.ts` gates all of this on not being inside Lovable's own sandbox
(`LOVABLE_SANDBOX` / `DEV_SERVER__PROJECT_PATH`), which forces its own
Cloudflare preset and output layout regardless. Lovable's preview and publish
are unaffected by anything here.

### Verifying the build locally

Netlify's environment is what triggers the preset, so reproduce it with:

```sh
rm -rf dist .netlify node_modules/.nitro
NETLIFY=true bun run build
ls dist/public                          # assets, _headers, favicon, robots
ls .netlify/functions-internal/server   # server.mjs must exist
```

If `.netlify/` is missing, the function won't deploy — see point 2 above.

## One-time setup

### 1. Connect the repo

Netlify → **Add new site → Import an existing project** → pick this repo and
the branch you want to deploy (`main`, or whichever branch you're shipping
from).

### 2. Build settings

`netlify.toml` specifies both, so Netlify picks them up automatically:

| Setting | Value |
|---|---|
| Build command | `bun run build` |
| Publish directory | `dist/public` |

> **Check the UI isn't overriding these.** Values set under **Site
> configuration → Build & deploy → Build settings** take precedence over
> `netlify.toml`, and Netlify's framework auto-detection can populate them
> when a site is first connected. In the build log they appear *before*
> `netlify.toml` is read:
>
> ```
> Custom build command detected. Proceeding with the specified command: '...'
> Custom publish path detected. Proceeding with the specified path: '...'
> ```
>
> If those lines don't match the table above, clear both fields in the UI so
> `netlify.toml` is the single source of truth. A stale UI publish path is
> exactly what produces *"Deploy directory does not exist"* even when the
> build itself succeeded.

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
   confirm the page copy, `<title>` and meta tags are present in the raw HTML.
   That confirms SSR actually ran — if the function failed to deploy you'd
   get a 404 or a bare shell instead.
2. Run through the interactive demo (`#demo`) — all three scenarios, Confirm
   / Correct / Why / Dismiss.
3. Submit the early-access form with a real address you can check, then in
   the Supabase dashboard's Table Editor confirm a new row landed in
   `public.waitlist` with `source = 'ulomis'`. (You won't see it from the
   browser — the anon key can insert but not read back, by design.)
4. Check both color themes and a couple of viewport widths (320px upward).

## If something breaks

- **"Deploy directory 'x' does not exist"** — the build succeeded but
  `publish` points somewhere Nitro didn't write. Check the UI override note
  in step 2, and that `publish` still matches `nitro.output.publicDir`.
- **Site deploys but every page 404s** — the static assets shipped without
  the SSR function. Confirm the build log contains *"Packaging Functions from
  .netlify/functions-internal directory"*; if not, something is overriding
  `nitro.output.serverDir` (see "Two things that will silently break this").
- **Early-access submissions don't show up in Supabase** — check the two env
  vars are actually set on the Netlify site (not just in `.env.example`
  locally), and check the browser console for the `[ulomis] early access
  signup failed` log, which includes the underlying Supabase error.
- **This branch is connected to Lovable** — pushing here also syncs back to
  the Lovable editor. Keep it in a working state; avoid force-pushing or
  rewriting history on it.
