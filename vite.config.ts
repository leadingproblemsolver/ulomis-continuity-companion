// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable's own sandbox forces the nitro preset back to cloudflare-module no
// matter what we pass below, so this same check gates both options that would
// otherwise fight that: outside the sandbox (this build, Netlify's build
// step, CI) nitro is skipped entirely — its own generic prerender step
// rebuilds a server bundle via raw rolldown, outside Vite's environment API,
// which can't resolve TanStack Start's virtual modules and 404s on every
// route. scripts/build-static.mjs produces the static export instead, from
// the same SSR bundle Vite already builds correctly.
const isLovableSandbox =
  process.env.LOVABLE_SANDBOX === "1" || Boolean(process.env.DEV_SERVER__PROJECT_PATH);

export default defineConfig({
  tanstackStart: {
    // nitro/vite builds from this when we're inside Lovable's sandbox.
    server: { entry: isLovableSandbox ? "server" : undefined },
  },
  nitro: isLovableSandbox ? undefined : false,
});
