// Real-browser smoke test (headless Chromium via Playwright). All data used is SYNTHETIC.
// Requires the `playwright` package and a Chromium build; optional axe-core for an automated a11y scan.
//   NODE_PATH=<dir containing playwright[, axe-core]> node test/smoke.mjs
// Exits non-zero on the first failed check; prints a PASS/FAIL line per check.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(path.join(process.cwd(), "noop.js"));
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("SKIPPED: playwright not installed (set NODE_PATH). Browser smoke test NOT run.");
  process.exit(2);
}
let axeSource = null;
try {
  axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
} catch {
  /* optional */
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const results = [];
let failed = false;
async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (e) {
    failed = true;
    results.push(`FAIL  ${name}: ${e.message}`);
    // Surface failures as GitHub annotations so they are visible without raw logs.
    if (process.env.GITHUB_ACTIONS)
      console.log(`::error title=smoke::${name}: ${e.message}`.replace(/\n/g, " "));
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const pad = (n) => String(n).padStart(2, "0");
function localInput(daysFromNow, hour) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00`;
}

const browser = await chromium.launch();
const context = await browser.newContext({
  acceptDownloads: true,
  timezoneId: "Asia/Qatar",
  locale: "en-GB",
});
const page = await context.newPage();
const consoleErrors = [];
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("dialog", (d) => d.accept());

async function addAssessment(fields) {
  const f = {
    type: "Quiz",
    title: "",
    status: "verified",
    sourceType: "D2L announcement",
    sourceRef: "",
    ...fields,
  };
  await page.selectOption("#type", f.type);
  await page.fill("#title", f.title);
  await page.fill("#when", f.when);
  await page.check(`input[name=status][value=${f.status}]`);
  await page.selectOption("#sourceType", f.status === "verified" ? f.sourceType : "");
  await page.fill("#sourceRef", f.sourceRef);
  await page.click("#saveBtn");
}
const items = () => page.locator("#list > li.item");
const feedback = async () => {
  await page.waitForTimeout(80);
  return page.textContent("#feedback");
};

await page.goto(base);

await check(
  "1. fresh start: zero assessments, unofficial/no-sync disclaimer above the fold",
  async () => {
    assert((await items().count()) === 0, "items present on fresh start");
    const notice = (await page.textContent("#notice")).replace(/\s+/g, " ");
    assert(
      /does not connect to D2L/.test(notice) && /does not send reminders/.test(notice),
      "disclaimer text",
    );
    const box = await page.locator("#notice").boundingBox();
    assert(box.y + box.height < 720, "disclaimer not above the fold at 720px");
  },
);

await check("3. empty submit shows accessible errors and saves nothing", async () => {
  await page.click("#saveBtn");
  assert(await page.isVisible("#errorSummary"), "summary hidden");
  assert(
    (await page.evaluate(() => document.activeElement.id)) === "errorSummary",
    "focus not on summary",
  );
  assert((await page.getAttribute("#when", "aria-invalid")) === "true", "when not aria-invalid");
  assert(
    (await page.getAttribute("#when", "aria-describedby")).includes("when-error"),
    "error not described",
  );
  assert((await items().count()) === 0, "something saved");
});

await check("3b. 'verified' without a source is refused (no false verified)", async () => {
  await addAssessment({ when: localInput(3, 10), sourceType: "", sourceRef: "" });
  const errs = await page.textContent("#errorList");
  assert(/choose where you checked/i.test(errs) && /note the announcement/i.test(errs), errs);
  assert((await items().count()) === 0, "saved anyway");
});

await check(
  "2. valid entry saves, preview shows timezone, feedback says not in calendar yet",
  async () => {
    await page.fill("#when", localInput(3, 10));
    assert(/Asia\/Qatar \(UTC\+03:00\)/.test(await page.textContent("#whenPreview")), "preview tz");
    await addAssessment({ when: localInput(3, 10), sourceRef: "SYNTHETIC announcement A" });
    assert((await items().count()) === 1, "not saved");
    assert(/Nothing has been added to your calendar yet/.test(await feedback()), "feedback");
    assert(/Within 7 days/.test(await items().first().textContent()), "status text");
  },
);

await check("2b. chronological order and survives reload", async () => {
  await addAssessment({
    type: "Lab",
    when: localInput(1, 9),
    sourceRef: "SYNTHETIC announcement B",
  });
  await page.reload();
  const heads = await page.locator("#list h3").allTextContents();
  assert(heads.length === 2, `after reload ${heads.length}`);
  assert(heads[0].includes("Lab") && heads[1].includes("Quiz"), heads.join(" | "));
});

await check("9a. duplicate is rejected", async () => {
  await addAssessment({ type: "Lab", when: localInput(1, 9), sourceRef: "SYNTHETIC dup" });
  assert((await items().count()) === 2, "duplicate saved");
  assert(/duplicate/i.test(await feedback()), "no duplicate message");
});

await check("9b. HTML injection renders as text", async () => {
  await addAssessment({
    type: "Other",
    title: '<img src=x onerror="window.__pwned=1">',
    when: localInput(20, 9),
    status: "unverified",
  });
  assert((await page.locator("#list img").count()) === 0, "img element injected");
  assert(!(await page.evaluate(() => window.__pwned)), "script executed");
  assert((await page.textContent("#list")).includes("<img src=x"), "text not shown literally");
  assert(/Unverified/.test(await page.textContent("#list")), "unverified not flagged");
});

let icsText = "";
await check("5. export downloads valid .ics, shows 'Exported ≠ imported' checklist", async () => {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#exportAll")]);
  icsText = fs.readFileSync(await dl.path(), "utf8");
  assert(
    icsText.startsWith("BEGIN:VCALENDAR\r\n") && icsText.trimEnd().endsWith("END:VCALENDAR"),
    "envelope",
  );
  assert((icsText.match(/BEGIN:VEVENT/g) || []).length === 3, "event count");
  assert((icsText.match(/TRIGGER:/g) || []).length === 9, "alarms");
  assert(/\[UNVERIFIED\]/.test(icsText), "unverified not marked");
  assert(/DTSTART:\d{8}T\d{6}Z/.test(icsText), "UTC time");
  assert(await page.isVisible("#exportHelp"), "help hidden");
  assert(
    /Exported is not the same as imported/.test(await page.textContent("#exportHelp")),
    "help text",
  );
  assert(/NOT in your calendar until you import it/.test(await feedback()), "feedback");
});

await check("5b. exported DTSTART equals the entered local time (Asia/Qatar)", async () => {
  const pageUtc = await page.evaluate(
    (v) =>
      new Date(v)
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, ""),
    localInput(1, 9),
  );
  assert(icsText.includes(`DTSTART:${pageUtc}`), `missing DTSTART:${pageUtc}`);
});

await check("6. editing after export never claims the calendar changed", async () => {
  await page
    .locator("#list li.item", { hasText: "Lab" })
    .getByRole("button", { name: /^Edit/ })
    .click();
  assert((await page.inputValue("#when")) === localInput(1, 9), "edit form not filled");
  await page.fill("#when", localInput(2, 11));
  await page.click("#saveBtn");
  assert(/Your calendar still has the OLD event/.test(await feedback()), "no stale warning");
  assert(/Changed after export/.test(await page.textContent("#list")), "stale flag missing");
});

await check("6b. calendar confirmation and delete messaging", async () => {
  const quiz = page.locator("#list li.item", { hasText: "Quiz" });
  await quiz.getByRole("button", { name: /in my calendar/ }).click();
  assert(/confirmed/.test(await feedback()), "confirm message");
  await quiz.getByRole("button", { name: /^Delete/ }).click();
  assert(/delete that event there yourself/.test(await feedback()), "delete message");
  assert((await items().count()) === 2, "not deleted");
});

await check("7. grades: midterm 0 scenario, 75% elsewhere => 60%; invalid rejected", async () => {
  await page.click("#midtermZero");
  await page.fill("#assumed", "75");
  await page.click("#gradeForm button[type=submit]");
  const r = await page.textContent("#gradeResult");
  assert(/average of 75% across the remaining 80%/.test(r), r);
  assert(/overall total would be 60%/.test(r), r);
  assert(/\(scenario\)/.test(r), "scenario not labelled");
  await page.fill("#g-final", "101");
  await page.click("#gradeForm button[type=submit]");
  assert(/Not calculated/.test(await page.textContent("#gradeResult")), "101 accepted");
  await page.click("#gradeClear");
  for (const k of ["final", "midterm", "labs", "quizzes", "tests"])
    await page.fill(`#g-${k}`, "100");
  await page.click("#gradeForm button[type=submit]");
  assert(/total is 100%/.test(await page.textContent("#gradeResult")), "100 case");
});

await check("9c. malformed storage does not crash and is not silently overwritten", async () => {
  await page.evaluate(() => localStorage.setItem("assessment_guard_v2", "{broken"));
  await page.reload();
  assert(/could not be read/.test(await feedback()), "no warning");
  assert(
    (await page.evaluate(() => localStorage.getItem("assessment_guard_v2"))) === "{broken",
    "overwritten",
  );
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

await check("9d. malformed backup restore is refused, list unchanged", async () => {
  await addAssessment({ when: localInput(4, 10), sourceRef: "SYNTHETIC C" });
  await page.setInputFiles("#restore", {
    name: "x.json",
    mimeType: "application/json",
    buffer: Buffer.from("[{]"),
  });
  assert(/Not restored/.test(await feedback()), "accepted");
  assert((await items().count()) === 1, "list changed");
});

await check("C. demo mode is labelled SYNTHETIC and never persisted", async () => {
  await page.click("#demoToggle");
  assert(await page.isVisible("#demoBanner"), "no banner");
  const heads = await page.locator("#list h3").allTextContents();
  assert(heads.length === 4 && heads.every((h) => h.includes("[SYNTHETIC]")), heads.join("|"));
  await page.reload();
  assert((await items().count()) === 1, "demo leaked into storage");
});

await check(
  "8a. keyboard: skip link first; Enter on focused Export triggers download",
  async () => {
    await page.keyboard.press("Tab");
    assert(
      (await page.evaluate(() => document.activeElement.className)) === "skip",
      "skip link not first",
    );
    await page.locator("#exportAll").focus();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);
    assert(dl, "no download");
    const outline = await page.evaluate(
      () => getComputedStyle(document.activeElement).outlineStyle,
    );
    assert(outline !== "none", "no focus outline");
  },
);

async function noHorizontalScroll(width, size) {
  await page.setViewportSize({ width, height: 800 });
  await page.selectOption("#textSize", size);
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  assert(sw <= cw, `overflow at ${width}px/${size}%: ${sw} > ${cw}`);
}
await check(
  "8b. reflow at 320px (100%) and 320px at 200% text — no horizontal scroll",
  async () => {
    await noHorizontalScroll(320, "100");
    await noHorizontalScroll(320, "200");
    const fs200 = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    assert(fs200 === "32px", `font-size ${fs200}`);
    await page.selectOption("#textSize", "100");
    await page.setViewportSize({ width: 1280, height: 800 });
  },
);

await check("8c. every form control and button has an accessible name", async () => {
  const unnamed = await page.evaluate(() =>
    [...document.querySelectorAll("input,select,button")]
      .filter((e) => !(e.labels?.length || e.getAttribute("aria-label") || e.textContent.trim()))
      .map((e) => e.id || e.outerHTML.slice(0, 60)),
  );
  assert(unnamed.length === 0, unnamed.join(", "));
});

if (axeSource) {
  await check(
    "8d. axe-core WCAG 2.1 A/AA scan (incl. colour contrast): zero violations",
    async () => {
      await page.addScriptTag({ content: axeSource });
      const res = await page.evaluate(() =>
        window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }),
      );
      const v = res.violations.map((x) => `${x.id} (${x.nodes.length})`);
      assert(v.length === 0, v.join(", "));
    },
  );
} else results.push("UNTESTED  8d. axe-core not installed");

await check("bundled single-file build (dist/) loads and saves", async () => {
  const dist = path.join(root, "dist/assessment-guard.html");
  assert(fs.existsSync(dist), "run npm run build first");
  const p2 = await context.newPage();
  const errs = [];
  p2.on("pageerror", (e) => errs.push(String(e)));
  await p2.goto(`${base}/dist/assessment-guard.html`);
  assert(
    (await p2.locator("#list > li.item").count()) === 1,
    "same-origin storage not shared/loaded",
  );
  assert(errs.length === 0, errs.join("; "));
  await p2.close();
});

await check("no console errors or uncaught exceptions during the run", async () => {
  assert(consoleErrors.length === 0, consoleErrors.join(" | "));
});

await browser.close();
server.close();
console.log(results.join("\n"));
console.log(
  failed
    ? "\nSMOKE: FAILED"
    : `\nSMOKE: ${results.filter((r) => r.startsWith("PASS")).length} checks passed`,
);
process.exit(failed ? 1 : 0);
