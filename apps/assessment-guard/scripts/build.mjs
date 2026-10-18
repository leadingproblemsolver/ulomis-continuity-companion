// Builds a single self-contained HTML file (dist/assessment-guard.html) for static hosting or
// sharing. No dependencies. `--check` builds in memory and verifies the result without writing.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const core = read("src/core.js");
const names = [...core.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]);
const coreBody = core.replace(/^export /gm, "");
const app = read("src/app.js").replace(/^import \* as C from "\.\/core\.js";\s*$/m, "");
if (/^import /m.test(app)) throw new Error("app.js has an unexpected import; update build.mjs");

const bundle = `"use strict";\nconst C = (() => {\n${coreBody}\nreturn { ${names.join(", ")} };\n})();\n${app}`;
let html = read("index.html");
const cssTag = '<link rel="stylesheet" href="styles.css" />';
const jsTag = '<script type="module" src="src/app.js"></script>';
if (!html.includes(cssTag) || !html.includes(jsTag))
  throw new Error("index.html tags changed; update build.mjs");
html = html.replace(cssTag, () => `<style>\n${read("styles.css")}</style>`);
html = html.replace(
  jsTag,
  () => `<script>\n${bundle.replace(/<\/script/gi, "<\\/script")}</script>`,
);

// Sanity: bundle must parse (compile only, never executed here).
new vm.Script(bundle, { filename: "assessment-guard-bundle.js" });

// Body-only variant for hosts that wrap the page in their own document skeleton
// (claude.ai artifacts): title + styles + body content + script, no html/head/body tags.
const titleTag = html.match(/<title>[\s\S]*?<\/title>/)[0];
const styleTag = html.match(/<style>[\s\S]*?<\/style>/)[0];
const bodyInner = html.match(/<body>([\s\S]*)<\/body>/)[1];
const hostedHtml = `${titleTag}\n<meta name="claude:viewport-fit-sides" content="cover" />\n${styleTag}\n${bodyInner}`;
if (/<\/?(html|head|body)[\s>]/i.test(hostedHtml))
  throw new Error("hosted variant still has skeleton tags");

if (process.argv.includes("--check")) {
  console.log(`build check ok: ${names.length} core exports, ${html.length} bytes`);
} else {
  fs.mkdirSync(path.join(root, "dist"), { recursive: true });
  fs.writeFileSync(path.join(root, "dist/assessment-guard.html"), html);
  fs.writeFileSync(path.join(root, "dist/hosted.html"), hostedHtml);
  console.log(`wrote dist/assessment-guard.html (${html.length} bytes) and dist/hosted.html`);
}
