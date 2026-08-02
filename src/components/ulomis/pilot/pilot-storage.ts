import {
  PILOT_SCHEMA_VERSION,
  createPilotState,
  type AttachmentRecord,
  type EncodedAttachment,
  type PilotIntakePacket,
  type PilotOutcomeReport,
  type PilotRecoveryPacket,
  type PilotState,
  type PreparedContinuityPacket,
} from "./pilot-types";

const PILOT_STATE_KEY = "ulomis-david-pilot-v1";
const FOUNDER_DRAFT_KEY = "ulomis-founder-workspace-v1";
const DB_NAME = "ulomis-pilot-local-files-v1";
const DB_VERSION = 1;
const ATTACHMENT_STORE = "attachments";

export type StorageResult = { ok: true } | { ok: false; reason: string };

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadPilotState(): PilotState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PILOT_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PilotState;
    if (parsed.kind !== "ulomis_pilot_state" || parsed.version !== PILOT_SCHEMA_VERSION) return null;
    const defaults = createPilotState(parsed.language === "ar" ? "ar" : "en");
    return {
      ...defaults,
      ...parsed,
      qualification: { ...defaults.qualification, ...parsed.qualification },
      baseline: { ...defaults.baseline, ...parsed.baseline },
      consent: { ...defaults.consent, ...parsed.consent },
      submission: { ...defaults.submission, ...parsed.submission },
      confirmation: { ...defaults.confirmation, ...parsed.confirmation },
      reentry: { ...defaults.reentry, ...parsed.reentry },
      result: { ...defaults.result, ...parsed.result },
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      corrections: Array.isArray(parsed.corrections) ? parsed.corrections : [],
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : defaults.auditLog,
    };
  } catch {
    return null;
  }
}

export function savePilotState(state: PilotState): StorageResult {
  if (!isBrowser()) return { ok: false, reason: "Browser storage is unavailable." };
  try {
    window.localStorage.setItem(PILOT_STATE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Browser storage is unavailable.";
    return { ok: false, reason };
  }
}

export function clearPilotState(): StorageResult {
  if (!isBrowser()) return { ok: false, reason: "Browser storage is unavailable." };
  try {
    window.localStorage.removeItem(PILOT_STATE_KEY);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unable to clear local data." };
  }
}

export function loadFounderDraft<T>(): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(FOUNDER_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveFounderDraft<T>(draft: T): StorageResult {
  if (!isBrowser()) return { ok: false, reason: "Browser storage is unavailable." };
  try {
    window.localStorage.setItem(FOUNDER_DRAFT_KEY, JSON.stringify(draft));
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unable to save the workspace draft." };
  }
}

export function clearFounderDraft(): StorageResult {
  if (!isBrowser()) return { ok: false, reason: "Browser storage is unavailable." };
  try {
    window.localStorage.removeItem(FOUNDER_DRAFT_KEY);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : "Unable to clear the workspace draft." };
  }
}

function openAttachmentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser() || !("indexedDB" in window)) {
      reject(new Error("Local file storage is not available in this browser."));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open local file storage."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
        const store = db.createObjectStore(ATTACHMENT_STORE, { keyPath: "id" });
        store.createIndex("pilotId", "pilotId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local file operation failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Local file transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Local file transaction was aborted."));
  });
}

export async function putAttachment(record: AttachmentRecord): Promise<void> {
  const db = await openAttachmentDb();
  try {
    const transaction = db.transaction(ATTACHMENT_STORE, "readwrite");
    const request = transaction.objectStore(ATTACHMENT_STORE).put(record);
    await requestToPromise(request);
  } finally {
    db.close();
  }
}

export async function getAttachment(id: string): Promise<AttachmentRecord | null> {
  const db = await openAttachmentDb();
  try {
    const request = db.transaction(ATTACHMENT_STORE, "readonly").objectStore(ATTACHMENT_STORE).get(id);
    return (await requestToPromise(request)) ?? null;
  } finally {
    db.close();
  }
}

export async function getPilotAttachments(pilotId: string): Promise<AttachmentRecord[]> {
  const db = await openAttachmentDb();
  try {
    const store = db.transaction(ATTACHMENT_STORE, "readonly").objectStore(ATTACHMENT_STORE);
    const index = store.index("pilotId");
    const request = index.getAll(pilotId);
    return await requestToPromise(request);
  } finally {
    db.close();
  }
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openAttachmentDb();
  try {
    const request = db.transaction(ATTACHMENT_STORE, "readwrite").objectStore(ATTACHMENT_STORE).delete(id);
    await requestToPromise(request);
  } finally {
    db.close();
  }
}

export async function deletePilotAttachments(pilotId: string): Promise<void> {
  await replacePilotAttachments(pilotId, []);
}

export async function replacePilotAttachments(pilotId: string, records: AttachmentRecord[]): Promise<void> {
  if (records.some((record) => record.pilotId !== pilotId)) {
    throw new Error("Cannot store an attachment under a different pilot ID.");
  }
  const existing = await getPilotAttachments(pilotId);
  const db = await openAttachmentDb();
  try {
    const transaction = db.transaction(ATTACHMENT_STORE, "readwrite");
    const store = transaction.objectStore(ATTACHMENT_STORE);
    for (const record of existing) store.delete(record.id);
    for (const record of records) store.put(record);
    await transactionToPromise(transaction);
  } finally {
    db.close();
  }
}

export async function sha256(data: ArrayBuffer | string): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  if (!globalThis.crypto?.subtle) throw new Error("This browser cannot create the SHA-256 integrity checks required for pilot transfer.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunk, bytes.length)));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export async function buildIntakePacket(state: PilotState): Promise<PilotIntakePacket> {
  const transferableSources = state.sources.filter((source) => source.status !== "excluded");
  const attachmentIds = new Set(
    transferableSources.map((source) => source.attachmentId).filter((id): id is string => Boolean(id)),
  );
  let attachments: AttachmentRecord[] = [];
  try {
    attachments = (await getPilotAttachments(state.pilotId)).filter((attachment) => attachmentIds.has(attachment.id));
  } catch (error) {
    if (attachmentIds.size) throw error;
  }
  if (attachments.length !== attachmentIds.size) {
    throw new Error("One or more included attachments are missing from local storage. Re-add them before exporting.");
  }
  const encoded: EncodedAttachment[] = attachments.map(({ data, ...record }) => ({
    ...record,
    base64: arrayBufferToBase64(data),
  }));
  return {
    kind: "ulomis_pilot_intake",
    version: PILOT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pilotId: state.pilotId,
    participantName: state.participantName,
    organization: state.organization,
    qualification: state.qualification,
    baseline: state.baseline,
    consent: state.consent,
    sources: transferableSources,
    attachments: encoded,
    boundary: {
      transferMethod: "user_download_and_manual_email",
      liveIntegrationsUsed: false,
      automatedReconstructionClaimed: false,
    },
  };
}

export async function buildRecoveryPacket(state: PilotState): Promise<PilotRecoveryPacket> {
  const expectedAttachmentIds = new Set(state.sources.map((source) => source.attachmentId).filter((id): id is string => Boolean(id)));
  let attachments: AttachmentRecord[] = [];
  try {
    attachments = await getPilotAttachments(state.pilotId);
  } catch (error) {
    if (expectedAttachmentIds.size) throw error;
  }
  if (attachments.length < expectedAttachmentIds.size) {
    throw new Error("The recovery file would be incomplete because one or more local attachments are missing.");
  }
  const encoded: EncodedAttachment[] = attachments.map(({ data, ...record }) => ({
    ...record,
    base64: arrayBufferToBase64(data),
  }));
  return {
    kind: "ulomis_pilot_recovery",
    version: PILOT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
    attachments: encoded,
    integrity: {
      algorithm: "SHA-256",
      stateSha256: await sha256(JSON.stringify(state)),
    },
    warning: "Contains thread state and any locally stored attachments. Store and transfer deliberately.",
  };
}

export function buildOutcomeReport(state: PilotState): PilotOutcomeReport {
  const baselineMinutes = state.baseline.normalReentryMinutes ?? 0;
  const pauseStarted = state.confirmation.pauseStartedAt ? new Date(state.confirmation.pauseStartedAt).getTime() : Number.NaN;
  const reentryStarted = state.reentry.startedAt ? new Date(state.reentry.startedAt).getTime() : Number.NaN;
  const interruptionMinutes = Number.isFinite(pauseStarted) && Number.isFinite(reentryStarted)
    ? Math.max(0, (reentryStarted - pauseStarted) / 60_000)
    : 0;
  const actualMinutes = (state.reentry.actualReentrySeconds ?? 0) / 60;
  const baselineAdminMinutes = state.baseline.normalAdminMinutes ?? 0;
  const actualAdminMinutes = state.reentry.actualAdminMinutes ?? 0;
  const baselineSources = state.baseline.sourcesNormallyOpened ?? 0;
  const baselinePeople = state.baseline.peopleNormallyContacted ?? 0;
  return {
    kind: "ulomis_pilot_outcome",
    version: PILOT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    pilotId: state.pilotId,
    participantName: state.participantName,
    organization: state.organization,
    threadLabel: state.qualification.threadLabel,
    interruption: {
      expectedReturnDate: state.qualification.expectedReturnDate,
      confirmedAt: state.confirmation.confirmedAt,
      pauseStartedAt: state.confirmation.pauseStartedAt,
      reentryStartedAt: state.reentry.startedAt,
      observedMinutes: interruptionMinutes,
      earlyReturnConfirmed: state.reentry.earlyReturnConfirmed,
      evidenceStrength: state.reentry.earlyReturnConfirmed ? "early_return_weaker_evidence" : "expected_window_or_later",
    },
    baseline: state.baseline,
    outcome: state.reentry,
    measured: {
      baselineReentryMinutes: baselineMinutes,
      actualReentryMinutes: actualMinutes,
      baselineAdminMinutes,
      actualAdminMinutes,
      adminMinutesDelta: baselineAdminMinutes - actualAdminMinutes,
      reentryMinutesDelta: baselineMinutes - actualMinutes,
      baselineSources,
      sourcesReopened: state.reentry.sourcesReopened,
      sourcesDelta: baselineSources - state.reentry.sourcesReopened,
      baselinePeople,
      peopleContacted: state.reentry.peopleContacted,
      peopleDelta: baselinePeople - state.reentry.peopleContacted,
      stateConfidenceDelta:
        state.baseline.stateConfidence != null && state.reentry.stateConfidenceAfter != null
          ? state.reentry.stateConfidenceAfter - state.baseline.stateConfidence
          : null,
      nextActionConfidenceDelta:
        state.baseline.nextActionConfidence != null && state.reentry.nextActionConfidenceAfter != null
          ? state.reentry.nextActionConfidenceAfter - state.baseline.nextActionConfidence
          : null,
    },
    correctionsCount: state.corrections.filter((correction) => correction.choice !== "correct").length,
    decision: state.result.decision,
    evidenceBoundary: "single_workflow_observation_not_repeatability_proof",
    finalizedAt: state.result.finalizedAt,
  };
}

export function downloadJson(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function downloadText(fileName: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const pilotStages = new Set([
  "welcome",
  "qualification",
  "baseline",
  "intake",
  "processing",
  "review",
  "awaiting_reentry",
  "reentry",
  "result",
]);

export function parseIntakePacket(value: unknown): PilotIntakePacket {
  if (!isRecord(value)) throw new Error("This is not a compatible Ulomis intake packet.");
  const packet = value as Partial<PilotIntakePacket>;
  const sources = Array.isArray(packet.sources) ? packet.sources : [];
  const attachments = Array.isArray(packet.attachments) ? packet.attachments : [];
  const qualification = packet.qualification;
  const baseline = packet.baseline;
  const consent = packet.consent;
  const boundary = packet.boundary;
  const sourceIds = new Set<string>();
  const sourcesValid = sources.length >= 2 && sources.every((source) => {
    if (!source || typeof source.id !== "string" || sourceIds.has(source.id)) return false;
    sourceIds.add(source.id);
    return typeof source.label === "string" &&
      typeof source.kind === "string" &&
      typeof source.status === "string" &&
      typeof source.text === "string" &&
      typeof source.link === "string" &&
      typeof source.sha256 === "string" && source.sha256.length >= 16;
  });
  const attachmentsValid = attachments.every((attachment) =>
    attachment &&
    typeof attachment.id === "string" &&
    typeof attachment.pilotId === "string" &&
    typeof attachment.name === "string" &&
    isFiniteNumber(attachment.size) && attachment.size >= 0 &&
    typeof attachment.sha256 === "string" &&
    typeof attachment.base64 === "string",
  );
  if (
    packet.kind !== "ulomis_pilot_intake" ||
    packet.version !== PILOT_SCHEMA_VERSION ||
    typeof packet.pilotId !== "string" || !packet.pilotId ||
    packet.participantName !== "David" ||
    packet.organization !== "ReferAll" ||
    !qualification || typeof qualification.threadLabel !== "string" || !qualification.threadLabel.trim() ||
    typeof qualification.confirmedAt !== "string" ||
    !baseline || !isFiniteNumber(baseline.normalReentryMinutes) || baseline.normalReentryMinutes <= 0 ||
    !isFiniteNumber(baseline.normalAdminMinutes) || baseline.normalAdminMinutes < 0 || baseline.normalAdminMinutes > baseline.normalReentryMinutes ||
    !isFiniteNumber(baseline.sourcesNormallyOpened) || baseline.sourcesNormallyOpened < 2 ||
    !isFiniteNumber(baseline.peopleNormallyContacted) || baseline.peopleNormallyContacted < 0 ||
    !isFiniteNumber(baseline.stateConfidence) ||
    !isFiniteNumber(baseline.nextActionConfidence) ||
    typeof baseline.capturedAt !== "string" ||
    !consent?.permissionConfirmed || !consent.redactionConfirmed || !consent.localBoundaryConfirmed || typeof consent.confirmedAt !== "string" ||
    boundary?.transferMethod !== "user_download_and_manual_email" || boundary.liveIntegrationsUsed !== false || boundary.automatedReconstructionClaimed !== false ||
    !sourcesValid || !attachmentsValid
  ) {
    throw new Error("This is not a compatible or complete Ulomis intake packet.");
  }
  return packet as PilotIntakePacket;
}

export function parsePreparedPacket(value: unknown, pilotId: string): PreparedContinuityPacket {
  if (!isRecord(value)) throw new Error("This continuity file does not match this pilot.");
  const packet = value as Partial<PreparedContinuityPacket>;
  if (
    packet.kind !== "ulomis_prepared_continuity" ||
    packet.version !== PILOT_SCHEMA_VERSION ||
    packet.pilotId !== pilotId ||
    packet.participantName !== "David" ||
    packet.organization !== "ReferAll" ||
    typeof packet.exportedAt !== "string" ||
    !packet.continuity || typeof packet.continuity.preparedAt !== "string" || typeof packet.continuity.preparedBy !== "string" ||
    typeof packet.continuity.operatorMessage !== "string" || !Array.isArray(packet.continuity.claims) ||
    !Array.isArray(packet.sourceManifest) ||
    packet.boundary?.founderAssisted !== true || packet.boundary.confirmedByParticipant !== false || packet.boundary.liveIntegrationsUsed !== false
  ) {
    throw new Error("This continuity file does not match this pilot.");
  }
  return packet as PreparedContinuityPacket;
}

export function parseRecoveryPacket(value: unknown): { state: PilotState; attachments: EncodedAttachment[]; integrity: PilotRecoveryPacket["integrity"] } {
  if (!isRecord(value)) throw new Error("This is not a compatible Ulomis recovery file.");
  const packet = value as Partial<PilotRecoveryPacket>;
  const state = packet.state;
  const attachments = Array.isArray(packet.attachments) ? packet.attachments : [];
  const stateValid = Boolean(
    state?.kind === "ulomis_pilot_state" &&
    state.version === PILOT_SCHEMA_VERSION &&
    typeof state.pilotId === "string" && state.pilotId &&
    state.participantName === "David" &&
    state.organization === "ReferAll" &&
    (state.language === "en" || state.language === "ar") &&
    pilotStages.has(state.stage) &&
    typeof state.reentry?.earlyReturnConfirmed === "boolean" &&
    Array.isArray(state.reentry?.sourceIdsOpenedFromUlomis) &&
    isFiniteNumber(state.reentry?.otherSourcesReopened) && state.reentry.otherSourcesReopened >= 0 &&
    isFiniteNumber(state.reentry?.sourcesReopened) && state.reentry.sourcesReopened >= 0 &&
    Array.isArray(state.sources) &&
    Array.isArray(state.corrections) &&
    Array.isArray(state.auditLog),
  );
  const attachmentsValid = attachments.every((attachment) =>
    attachment && typeof attachment.id === "string" && typeof attachment.pilotId === "string" &&
    typeof attachment.sha256 === "string" && typeof attachment.base64 === "string" && isFiniteNumber(attachment.size),
  );
  const integrityValid = packet.integrity?.algorithm === "SHA-256" &&
    typeof packet.integrity.stateSha256 === "string" && packet.integrity.stateSha256.length === 64;
  if (packet.kind !== "ulomis_pilot_recovery" || packet.version !== PILOT_SCHEMA_VERSION || !stateValid || !attachmentsValid || !integrityValid) {
    throw new Error("This is not a compatible Ulomis recovery file.");
  }
  return { state: state!, attachments, integrity: packet.integrity! };
}
