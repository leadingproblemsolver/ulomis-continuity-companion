// Static export for hosts with no server (Netlify, any plain static host).
//
// Nitro's own prerender step rebuilds a separate server bundle via raw
// rolldown, outside Vite's environment API — TanStack Start's virtual
// modules (route tree, manifest, server entry) don't resolve there, so every
// route 404s. Sidestepping it: `vite build` already produces a working SSR
// bundle at dist/server/server.js (the same one that serves requests in a
// real deployment). This script invokes it once for "/" — the app's only
// route — and writes the response as dist/client/index.html, which is then a
// plain static file a host can serve with no server at request time.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const serverEntry = path.join(root, "dist/server/server.js");
const clientDir = path.join(root, "dist/client");
const outFile = path.join(clientDir, "index.html");

if (!existsSync(serverEntry)) {
  throw new Error(`Expected ${serverEntry} — run the vite build first.`);
}
if (!existsSync(clientDir)) {
  throw new Error(`Expected ${clientDir} — run the vite build first.`);
}

const { default: handler } = await import(pathToFileURL(serverEntry).href);
const response = await handler.fetch(new Request("http://localhost/"), {}, {});

if (response.status !== 200) {
  throw new Error(`Prerendering "/" returned ${response.status}, expected 200.`);
}

const html = await response.text();
if (!html.includes("<title>Ulomis")) {
  throw new Error(
    'Prerendered HTML is missing the expected "<title>Ulomis" — refusing to ship it.',
  );
}

await writeFile(outFile, html, "utf8");
console.log(`[build-static] wrote ${path.relative(root, outFile)} (${html.length} bytes)`);
