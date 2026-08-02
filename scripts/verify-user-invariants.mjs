import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const dataPath = new URL("../src/components/ulomis/journey-data.ts", import.meta.url);
const demoPath = new URL("../src/components/ulomis/JourneyDemo.tsx", import.meta.url);
const analyticsPath = new URL("../src/lib/analytics.ts", import.meta.url);

const dataSource = fs.readFileSync(dataPath, "utf8");
const demoSource = fs.readFileSync(demoPath, "utf8");
const analyticsSource = fs.readFileSync(analyticsPath, "utf8");

const compiled = ts.transpileModule(dataSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { module, exports: module.exports, console });
const { scenarios } = module.exports;

const errors = [];
const correctionChoices = ["correct", "partial", "outdated", "unrelated", "missing"];
const requiredFields = [
  "objective",
  "previousState",
  "currentState",
  "changes",
  "decision",
  "commitments",
  "dependencies",
  "openLoop",
  "missingInformation",
  "suggestedNextAction",
  "owners",
  "uncertainItem",
  "correctionOutcomes",
];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function scanLocalized(value, path, missing) {
  if (!value || typeof value !== "object") return;
  if (!Array.isArray(value) && Object.keys(value).length === 2 && "en" in value && "ar" in value) {
    if (!value.en || !value.ar) missing.push(path);
    return;
  }
  if (Array.isArray(value)) value.forEach((item, index) => scanLocalized(item, `${path}[${index}]`, missing));
  else Object.entries(value).forEach(([key, child]) => scanLocalized(child, `${path}.${key}`, missing));
}

for (const scenario of scenarios) {
  const prefix = `[${scenario.id}]`;
  for (const field of requiredFields) assert(field in scenario, `${prefix} missing ${field}`);

  const fragmentIds = new Set(scenario.fragments.map((fragment) => fragment.id));
  assert(fragmentIds.size === scenario.fragments.length, `${prefix} fragment IDs must be unique`);

  const references = [
    scenario.objectiveSourceIds,
    scenario.previousStateSourceIds,
    scenario.currentStateSourceIds,
    scenario.nextActionSourceIds,
    scenario.decision.sourceIds,
    scenario.openLoop.sourceIds,
    scenario.uncertainItem.sourceIds,
    ...scenario.changes.map((item) => item.sourceIds),
    ...scenario.commitments.map((item) => item.sourceIds),
    ...scenario.dependencies.map((item) => item.sourceIds),
  ].flat();
  for (const reference of references) {
    assert(fragmentIds.has(reference), `${prefix} provenance reference ${reference} does not resolve`);
  }

  for (const choice of correctionChoices) {
    assert(Boolean(scenario.correctionOutcomes[choice]), `${prefix} missing correction outcome ${choice}`);
  }

  const missingLocalization = [];
  scanLocalized(scenario, prefix, missingLocalization);
  assert(missingLocalization.length === 0, `${prefix} missing localization: ${missingLocalization.join(", ")}`);
}

const uiRequirements = {
  "journey persistence": "JOURNEY_STORAGE_KEY",
  "real-thread draft persistence": "REAL_THREAD_STORAGE_KEY",
  "correction-driven state": "scenario.correctionOutcomes[state.correction]",
  "continuity export": "exportContinuity",
  "local deletion": "deleteLocalContinuity",
  "real save state": 'setThreadStatus("saved")',
  "real deferred state": 'setThreadStatus("deferred")',
  "real completion state": 'setThreadStatus("completed")',
  "optional re-entry baseline": "expectedReentryTime",
  "reduced-motion behavior": "prefers-reduced-motion: reduce",
};
for (const [name, token] of Object.entries(uiRequirements)) {
  const haystack = token === "prefers-reduced-motion: reduce"
    ? fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8")
    : demoSource;
  assert(haystack.includes(token), `UI missing ${name}`);
}

for (const eventName of [
  "thread_saved",
  "thread_deferred",
  "thread_completed",
  "thread_reopened",
  "continuity_exported",
  "local_data_deleted",
]) {
  assert(analyticsSource.includes(`\"${eventName}\"`), `Analytics event type missing ${eventName}`);
}

if (errors.length) {
  console.error(`Ulomis invariant verification failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Ulomis invariant verification passed: ${scenarios.length} scenarios, bilingual provenance, correction outcomes, persistence, export/delete, and real state controls.`);
