// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Lovable's sandbox forces its own preset and output layout regardless of what
// we pass, so gate on the same check its config package uses. Outside the
// sandbox (Netlify's build, CI, local) our settings below actually apply.
const isLovableSandbox =
  process.env.LOVABLE_SANDBOX === "1" || Boolean(process.env.DEV_SERVER__PROJECT_PATH);

export default defineConfig({
  tanstackStart: {
    // src/server.ts wraps the bundled entry in a `fetch(request, env, ctx)`
    // module export, which is the shape both the Cloudflare (Lovable) and
    // Netlify presets expect.
    server: { entry: "server" },
  },
  // Pin where the *static assets* land, because netlify.toml's `publish` has
  // to match it exactly or the deploy fails with "Deploy directory does not
  // exist". Deliberately do NOT pin `serverDir`: each preset puts its server
  // bundle where its host expects to find it (Netlify wants
  // `.netlify/functions-internal/`), and overriding that silently produces a
  // build with no deployable function.
  nitro: isLovableSandbox
    ? undefined
    : {
        output: {
          publicDir: "dist/public",
        },
      },
});
