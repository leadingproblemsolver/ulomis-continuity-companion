import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = path.resolve(new URL("..", import.meta.url).pathname);
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function transpile(relative, module = ts.ModuleKind.CommonJS) {
  const source = read(relative);
  const result = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      errors.push(`${relative}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    }
  }
  return result.outputText;
}

function evaluateTypeOnlyModule(relative) {
  const output = transpile(relative);
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    console,
    crypto: globalThis.crypto,
    Date,
    TextEncoder,
  });
  return module.exports;
}

const requiredFiles = [
  "src/routes/pilot/david.tsx",
  "src/routes/pilot/workspace.tsx",
  "src/components/ulomis/pilot/PilotFlow.tsx",
  "src/components/ulomis/pilot/FounderWorkspace.tsx",
  "src/components/ulomis/pilot/PilotContinuityView.tsx",
  "src/components/ulomis/pilot/pilot-types.ts",
  "src/components/ulomis/pilot/pilot-storage.ts",
  "src/components/ulomis/pilot/pilot-copy.ts",
  "PILOT_OPERATOR_RUNBOOK.md",
  "PILOT_DATA_BOUNDARY.md",
];
for (const file of requiredFiles) assert(fs.existsSync(path.join(root, file)), `Missing required pilot artifact: ${file}`);

// Syntax-transpile every source file. This does not replace the real build, but catches parser regressions.
function walk(directory) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) output.push(full);
  }
  return output;
}
for (const file of walk(path.join(root, "src"))) {
  const relative = path.relative(root, file);
  transpile(relative, ts.ModuleKind.ESNext);
}

const types = evaluateTypeOnlyModule("src/components/ulomis/pilot/pilot-types.ts");

function evaluateStorageModule() {
  const output = transpile("src/components/ulomis/pilot/pilot-storage.ts");
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id === "./pilot-types") return types;
      throw new Error(`Unexpected pilot-storage dependency: ${id}`);
    },
    console,
    Date,
    TextEncoder,
    Uint8Array,
    ArrayBuffer,
    Blob,
    URL,
    setTimeout,
    clearTimeout,
  });
  return module.exports;
}

const storageModule = evaluateStorageModule();
const state = types.createPilotState("en");
assert(state.participantName === "David", "Pilot is not configured for David.");
assert(state.organization === "ReferAll", "Pilot is not configured for ReferAll.");
assert(state.recipientRole === "direct_adopter", "Recipient role must be direct adopter.");
assert("normalAdminMinutes" in state.baseline, "Baseline must measure normal admin time.");
assert("actualAdminMinutes" in state.reentry, "Outcome must measure actual admin time.");
assert("earlyReturnConfirmed" in state.reentry, "Re-entry must record whether the participant returned before the selected date.");
assert(Array.isArray(state.reentry.sourceIdsOpenedFromUlomis), "Re-entry must track unique evidence sources opened from Ulomis.");
assert("otherSourcesReopened" in state.reentry, "Re-entry must separately count sources reopened outside Ulomis.");
assert(types.stageToStep("qualification") === 1, "Qualification must remain step 1.");
assert(types.stageToStep("processing") === 3, "Founder preparation must remain inside material step 3.");
assert(types.stageToStep("review") === 4, "Continuity confirmation must be step 4.");
assert(types.stageToStep("reentry") === 5, "Live re-entry must be step 5.");
assert(types.stageToStep("result") === 6, "Measured result must be step 6.");
assert(types.claimFieldOrder.length === 12, "Canonical continuity view must contain all 12 operational fields.");
for (const field of [
  "objective",
  "currentState",
  "latestMeaningfulChange",
  "decision",
  "rationale",
  "commitments",
  "dependencies",
  "unresolvedItems",
  "missingInformation",
  "owners",
  "contradictions",
  "nextAction",
]) assert(types.claimFieldOrder.includes(field), `Canonical continuity field missing: ${field}`);

const sampleClaim = {
  id: "claim",
  field: "currentState",
  value: "Original state",
  classification: "source_fact",
  confidence: 0.8,
  sourceIds: ["s1"],
  lastConfirmed: "2026-08-01",
  consequential: true,
};
assert(types.effectiveClaimValue(sampleClaim, []).value === "Original state", "Uncorrected claim should remain intact.");
assert(types.effectiveClaimValue(sampleClaim, [{ claimId: "claim", choice: "partial", correctedValue: "Corrected state", reason: "", revisedNextAction: "", createdAt: "x" }]).value === "Corrected state", "Partial correction must replace active state.");
assert(types.effectiveClaimValue(sampleClaim, [{ claimId: "claim", choice: "outdated", correctedValue: "", reason: "", revisedNextAction: "", createdAt: "x" }]).status === "removed", "Outdated claim must be removable from current state.");
assert(types.effectiveClaimValue(sampleClaim, [{ claimId: "claim", choice: "missing", correctedValue: "Missing fact", reason: "", revisedNextAction: "", createdAt: "x" }]).status === "expanded", "Missing information correction must expand current state.");

const measuredState = types.createPilotState("en");
measuredState.baseline.normalReentryMinutes = 20;
measuredState.baseline.normalAdminMinutes = 12;
measuredState.baseline.sourcesNormallyOpened = 5;
measuredState.baseline.peopleNormallyContacted = 2;
measuredState.baseline.stateConfidence = 2;
measuredState.baseline.nextActionConfidence = 2;
measuredState.reentry.actualReentrySeconds = 480;
measuredState.reentry.actualAdminMinutes = 5;
measuredState.reentry.sourcesReopened = 2;
measuredState.reentry.peopleContacted = 0;
measuredState.reentry.stateConfidenceAfter = 4;
measuredState.reentry.nextActionConfidenceAfter = 5;
measuredState.corrections = [
  { claimId: "a", choice: "correct", correctedValue: "", reason: "", revisedNextAction: "", createdAt: "x" },
  { claimId: "b", choice: "partial", correctedValue: "changed", reason: "", revisedNextAction: "", createdAt: "x" },
];
const measuredReport = storageModule.buildOutcomeReport(measuredState);
assert(measuredReport.measured.reentryMinutesDelta === 12, "Re-entry delta must preserve baseline minus observed time.");
assert(measuredReport.measured.adminMinutesDelta === 7, "Admin delta must preserve baseline minus actual admin time.");
assert(measuredReport.measured.sourcesDelta === 3, "Source delta must preserve baseline minus reopened sources.");
assert(measuredReport.measured.peopleDelta === 2, "Contact delta must preserve baseline minus contacted people.");
assert(measuredReport.correctionsCount === 1, "Looks-right confirmations must not count as material corrections.");
assert(measuredReport.interruption.evidenceStrength === "expected_window_or_later", "Normal return timing must remain explicit in the outcome report.");
measuredState.reentry.actualReentrySeconds = 1500;
measuredState.reentry.actualAdminMinutes = 15;
measuredState.reentry.sourcesReopened = 7;
measuredState.reentry.peopleContacted = 3;
const negativeReport = storageModule.buildOutcomeReport(measuredState);
assert(negativeReport.measured.reentryMinutesDelta === -5, "Slower re-entry must remain a negative delta.");
assert(negativeReport.measured.adminMinutesDelta === -3, "Additional admin must remain a negative delta.");
assert(negativeReport.measured.sourcesDelta === -2, "Additional sources must remain a negative delta.");
assert(negativeReport.measured.peopleDelta === -1, "Additional contacts must remain a negative delta.");

const flow = read("src/components/ulomis/pilot/PilotFlow.tsx");
const workspace = read("src/components/ulomis/pilot/FounderWorkspace.tsx");
const storage = read("src/components/ulomis/pilot/pilot-storage.ts");
const continuity = read("src/components/ulomis/pilot/PilotContinuityView.tsx");
const analytics = read("src/lib/analytics.ts");
const davidRoute = read("src/routes/pilot/david.tsx");
const workspaceRoute = read("src/routes/pilot/workspace.tsx");
const copy = read("src/components/ulomis/pilot/pilot-copy.ts");

const flowTokens = [
  'stage: "qualification"',
  'stage: "baseline"',
  'stage: "intake"',
  'stage: "processing"',
  'stage: "review"',
  'stage: "awaiting_reentry"',
  'stage: "reentry"',
  'stage: "result"',
  "normalAdminMinutes",
  "actualAdminMinutes",
  "pilot_baseline_captured",
  "pilot_packet_exported",
  "pilot_thread_confirmed",
  "pilot_reentry_started",
  "pilot_reentry_completed",
  "pilot_record_finalized",
  "validateSourceManifest",
  "actualReentrySeconds",
  "second_thread",
  "revise_repeat",
  '"stop"',
  "targetDeliveryAt",
  "pilotCopy.exportAudit",
  "pilotCopy.sameDeviceBoundary",
  "pilotCopy.timerBoundary",
  "The confirmed operational state is sealed",
  "baseline.normalAdminMinutes <= baseline.normalReentryMinutes",
  "state.reentry.actualAdminMinutes <= actualReentryMinutes",
  "corrections: []",
  "if (!state.submission.packetSentAt)",
  "disabled={!sent}",
  "participantError",
  "ForwardArrow",
  "BackArrow",
  "replacePilotAttachments",
  "Could not add this source or create its integrity check",
  "onExportRecovery={exportRecovery}",
  "Recovery state integrity check failed",
  "Deletion could not be verified",
  "earlyReturnConfirmed",
  "pilotCopy.earlyReturnConfirm",
  "pilotCopy.earlyEvidenceBoundary",
  "invalidateDerivedPilotState",
  "priorPacketInvalidated",
  "pilotCopy.returnToIntakeConfirm",
  "packetSentAt: null",
  "pilot_source_reopened_from_evidence",
  "sourceIdsOpenedFromUlomis",
  "otherSourcesReopened",
  "getAttachment",
];
for (const token of flowTokens) assert(flow.includes(token), `Pilot flow missing readiness control: ${token}`);

for (const token of [
  "user_download_and_manual_email",
  'liveIntegrationsUsed: false',
  'automatedReconstructionClaimed: false',
  'source.status !== "excluded"',
  "indexedDB",
  "replacePilotAttachments",
  "transactionToPromise",
  "stateSha256",
  'digest("SHA-256"',
  "attachments.length !== attachmentIds.size",
  "single_workflow_observation_not_repeatability_proof",
]) assert(storage.includes(token), `Pilot storage/boundary missing: ${token}`);

for (const token of [
  "validateDraft",
  "sourceIds",
  "confidence",
  "lastConfirmed",
  'founderAssisted: true',
  'confirmedByParticipant: false',
  "Attachment integrity check failed",
  "Do not resolve uncertainty silently",
]) assert(workspace.includes(token), `Founder workspace missing control: ${token}`);

for (const token of [
  "pilotCopy.whyShown",
  'choice === "missing"', 
  "classificationLabels",
  "confidence",
  "claimSources",
  "correction",
  "onOpenAttachment",
  "onSourceReferenceOpened",
]) assert(continuity.includes(token), `Continuity review missing trust surface: ${token}`);

assert(!flow.includes("fetch("), "David pilot must not silently transmit thread content.");
assert(!workspace.includes("fetch("), "Founder workspace must remain local and manual for this pilot.");
assert(analytics.includes("window.dispatchEvent"), "Vendor-neutral event dispatch is missing.");
assert(analytics.includes("pilotId"), "Pilot events must include a non-content pilot identifier.");
assert(davidRoute.includes('noindex, nofollow, noarchive'), "David pilot route must be excluded from indexing.");
assert(workspaceRoute.includes('noindex, nofollow, noarchive'), "Founder workspace route must be excluded from indexing.");
assert(copy.includes("Email is not an encrypted client-data channel"), "Email transfer limitation is not disclosed.");
assert(copy.includes("export creates a separate copy and email is not encrypted"), "Transfer risk must be acknowledged before the packet is exported.");
assert(copy.includes("does not add encryption to browser storage"), "Local browser-storage limitation is not disclosed.");
assert(copy.includes("correct only what matters") || copy.includes("Correct only"), "Low-burden correction promise is missing.");
assert(copy.includes("If that does not happen, the test has not demonstrated value"), "Failure-to-deliver boundary is missing.");
assert(copy.includes("self-reported baseline"), "Results must identify the baseline as self-reported.");
assert(copy.includes("The page address does not contain your thread state"), "Same-device/local-state return boundary is missing.");
assert(copy.includes("Negative values remain visible"), "Negative outcomes must remain visible rather than becoming savings.");
assert(copy.includes("weaker interruption evidence"), "An early return must be disclosed as weaker evidence.");

if (errors.length) {
  console.error(`Ulomis pilot readiness verification failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Ulomis pilot readiness verification passed: dedicated workflow, baseline/admin metrics, bounded source transfer, founder reconstruction, provenance, correction, confirmation, live re-entry timing, outcome calculation, auditability, recovery, and explicit stop/continue decision.");
