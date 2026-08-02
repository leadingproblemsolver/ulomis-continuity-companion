import type { Language } from "../journey-data";

export const PILOT_SCHEMA_VERSION = 1 as const;

export type PilotStage =
  | "welcome"
  | "qualification"
  | "baseline"
  | "intake"
  | "processing"
  | "review"
  | "awaiting_reentry"
  | "reentry"
  | "result";

export type PilotStep = 1 | 2 | 3 | 4 | 5 | 6;

export type SourceKind =
  | "email"
  | "message"
  | "note"
  | "calendar"
  | "document"
  | "spreadsheet"
  | "screenshot"
  | "link"
  | "verbal";

export type SourceStatus = "included" | "redacted" | "excluded" | "needs_clarification";

export type ClaimClassification =
  | "source_fact"
  | "user_statement"
  | "inference"
  | "suggestion"
  | "contradiction";

export type ClaimField =
  | "objective"
  | "currentState"
  | "latestMeaningfulChange"
  | "decision"
  | "rationale"
  | "commitments"
  | "dependencies"
  | "unresolvedItems"
  | "missingInformation"
  | "owners"
  | "contradictions"
  | "nextAction";

export type CorrectionChoice = "correct" | "partial" | "outdated" | "unrelated" | "missing";

export type PilotDecision = "second_thread" | "revise_repeat" | "stop";

export type YesNoUnknown = "yes" | "no" | "unknown";

export type PilotAuditEvent = {
  id: string;
  at: string;
  name: string;
  stage: PilotStage;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ThreadQualification = {
  threadLabel: string;
  expectedReturnDate: string;
  active: boolean;
  clientFacing: boolean;
  multiSource: boolean;
  hasOpenLoop: boolean;
  safeToShare: boolean;
  summary: string;
  confirmedAt: string | null;
};

export type PilotBaseline = {
  normalReentryMinutes: number | null;
  normalAdminMinutes: number | null;
  sourcesNormallyOpened: number | null;
  peopleNormallyContacted: number | null;
  stateConfidence: number | null;
  nextActionConfidence: number | null;
  primaryFriction: string;
  capturedAt: string | null;
};

export type PilotSource = {
  id: string;
  kind: SourceKind;
  label: string;
  sourceDate: string;
  status: SourceStatus;
  text: string;
  link: string;
  attachmentId: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  sha256: string;
  addedAt: string;
};

export type PilotConsent = {
  permissionConfirmed: boolean;
  redactionConfirmed: boolean;
  localBoundaryConfirmed: boolean;
  confirmedAt: string | null;
};

export type PilotSubmission = {
  packetPreparedAt: string | null;
  packetSentAt: string | null;
  targetDeliveryAt: string | null;
  packetFileName: string | null;
  clarificationRequested: boolean;
};

export type ContinuityClaim = {
  id: string;
  field: ClaimField;
  value: string;
  classification: ClaimClassification;
  confidence: number;
  sourceIds: string[];
  lastConfirmed: string;
  consequential: boolean;
};

export type PreparedContinuity = {
  preparedAt: string;
  preparedBy: string;
  operatorMessage: string;
  claims: ContinuityClaim[];
};

export type ClaimCorrection = {
  claimId: string;
  choice: CorrectionChoice;
  correctedValue: string;
  reason: string;
  revisedNextAction: string;
  createdAt: string;
};

export type PilotConfirmation = {
  confirmedAt: string | null;
  selectedNextAction: string;
  pauseStartedAt: string | null;
  recoveryExportedAt: string | null;
};

export type PilotReentry = {
  startedAt: string | null;
  earlyReturnConfirmed: boolean;
  actualAdminMinutes: number | null;
  completedAt: string | null;
  actualReentrySeconds: number | null;
  sourceIdsOpenedFromUlomis: string[];
  otherSourcesReopened: number;
  sourcesReopened: number;
  peopleContacted: number;
  correctionsRequiredOnReturn: number;
  nextActionTaken: YesNoUnknown;
  duplicatedWorkAvoided: YesNoUnknown;
  followupsAvoided: YesNoUnknown;
  coordinationStepsAvoided: number | null;
  stateConfidenceAfter: number | null;
  nextActionConfidenceAfter: number | null;
  notes: string;
};

export type PilotResult = {
  decision: PilotDecision | null;
  finalizedAt: string | null;
};

export type PilotState = {
  kind: "ulomis_pilot_state";
  version: typeof PILOT_SCHEMA_VERSION;
  pilotId: string;
  participantName: string;
  organization: string;
  recipientRole: "direct_adopter";
  language: Language;
  stage: PilotStage;
  createdAt: string;
  updatedAt: string;
  qualification: ThreadQualification;
  baseline: PilotBaseline;
  consent: PilotConsent;
  sources: PilotSource[];
  submission: PilotSubmission;
  continuity: PreparedContinuity | null;
  corrections: ClaimCorrection[];
  confirmation: PilotConfirmation;
  reentry: PilotReentry;
  result: PilotResult;
  auditLog: PilotAuditEvent[];
};

export type AttachmentRecord = {
  id: string;
  pilotId: string;
  name: string;
  type: string;
  size: number;
  sha256: string;
  addedAt: string;
  data: ArrayBuffer;
};

export type EncodedAttachment = Omit<AttachmentRecord, "data"> & {
  base64: string;
};

export type PilotIntakePacket = {
  kind: "ulomis_pilot_intake";
  version: typeof PILOT_SCHEMA_VERSION;
  exportedAt: string;
  pilotId: string;
  participantName: string;
  organization: string;
  qualification: ThreadQualification;
  baseline: PilotBaseline;
  consent: PilotConsent;
  sources: PilotSource[];
  attachments: EncodedAttachment[];
  boundary: {
    transferMethod: "user_download_and_manual_email";
    liveIntegrationsUsed: false;
    automatedReconstructionClaimed: false;
  };
};

export type PreparedContinuityPacket = {
  kind: "ulomis_prepared_continuity";
  version: typeof PILOT_SCHEMA_VERSION;
  exportedAt: string;
  pilotId: string;
  participantName: string;
  organization: string;
  continuity: PreparedContinuity;
  sourceManifest: Array<Pick<PilotSource, "id" | "label" | "kind" | "sha256">>;
  boundary: {
    founderAssisted: true;
    confirmedByParticipant: false;
    liveIntegrationsUsed: false;
  };
};

export type PilotRecoveryPacket = {
  kind: "ulomis_pilot_recovery";
  version: number;
  exportedAt: string;
  state: PilotState;
  attachments: EncodedAttachment[];
  integrity: {
    algorithm: "SHA-256";
    stateSha256: string;
  };
  warning: string;
};

export type PilotOutcomeReport = {
  kind: "ulomis_pilot_outcome";
  version: typeof PILOT_SCHEMA_VERSION;
  exportedAt: string;
  pilotId: string;
  participantName: string;
  organization: string;
  threadLabel: string;
  interruption: {
    expectedReturnDate: string;
    confirmedAt: string | null;
    pauseStartedAt: string | null;
    reentryStartedAt: string | null;
    observedMinutes: number;
    earlyReturnConfirmed: boolean;
    evidenceStrength: "expected_window_or_later" | "early_return_weaker_evidence";
  };
  baseline: PilotBaseline;
  outcome: PilotReentry;
  measured: {
    baselineReentryMinutes: number;
    actualReentryMinutes: number;
    baselineAdminMinutes: number;
    actualAdminMinutes: number;
    adminMinutesDelta: number;
    reentryMinutesDelta: number;
    baselineSources: number;
    sourcesReopened: number;
    sourcesDelta: number;
    baselinePeople: number;
    peopleContacted: number;
    peopleDelta: number;
    stateConfidenceDelta: number | null;
    nextActionConfidenceDelta: number | null;
  };
  correctionsCount: number;
  decision: PilotDecision | null;
  evidenceBoundary: "single_workflow_observation_not_repeatability_proof";
  finalizedAt: string | null;
};

export const claimFieldOrder: ClaimField[] = [
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
];

export function stageToStep(stage: PilotStage): PilotStep {
  if (stage === "welcome" || stage === "qualification") return 1;
  if (stage === "baseline") return 2;
  if (stage === "intake" || stage === "processing") return 3;
  if (stage === "review") return 4;
  if (stage === "awaiting_reentry" || stage === "reentry") return 5;
  return 6;
}

export function createPilotState(language: Language = "en"): PilotState {
  const now = new Date().toISOString();
  const pilotId = globalThis.crypto?.randomUUID?.() ?? `pilot-${Date.now()}`;
  return {
    kind: "ulomis_pilot_state",
    version: PILOT_SCHEMA_VERSION,
    pilotId,
    participantName: "David",
    organization: "ReferAll",
    recipientRole: "direct_adopter",
    language,
    stage: "welcome",
    createdAt: now,
    updatedAt: now,
    qualification: {
      threadLabel: "",
      expectedReturnDate: "",
      active: false,
      clientFacing: false,
      multiSource: false,
      hasOpenLoop: false,
      safeToShare: false,
      summary: "",
      confirmedAt: null,
    },
    baseline: {
      normalReentryMinutes: null,
      normalAdminMinutes: null,
      sourcesNormallyOpened: null,
      peopleNormallyContacted: null,
      stateConfidence: null,
      nextActionConfidence: null,
      primaryFriction: "",
      capturedAt: null,
    },
    consent: {
      permissionConfirmed: false,
      redactionConfirmed: false,
      localBoundaryConfirmed: false,
      confirmedAt: null,
    },
    sources: [],
    submission: {
      packetPreparedAt: null,
      packetSentAt: null,
      targetDeliveryAt: null,
      packetFileName: null,
      clarificationRequested: false,
    },
    continuity: null,
    corrections: [],
    confirmation: {
      confirmedAt: null,
      selectedNextAction: "",
      pauseStartedAt: null,
      recoveryExportedAt: null,
    },
    reentry: {
      startedAt: null,
      earlyReturnConfirmed: false,
      actualAdminMinutes: null,
      completedAt: null,
      actualReentrySeconds: null,
      sourceIdsOpenedFromUlomis: [],
      otherSourcesReopened: 0,
      sourcesReopened: 0,
      peopleContacted: 0,
      correctionsRequiredOnReturn: 0,
      nextActionTaken: "unknown",
      duplicatedWorkAvoided: "unknown",
      followupsAvoided: "unknown",
      coordinationStepsAvoided: null,
      stateConfidenceAfter: null,
      nextActionConfidenceAfter: null,
      notes: "",
    },
    result: { decision: null, finalizedAt: null },
    auditLog: [
      {
        id: globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}`,
        at: now,
        name: "pilot_created",
        stage: "welcome",
      },
    ],
  };
}

export function effectiveClaimValue(
  claim: ContinuityClaim,
  corrections: ClaimCorrection[],
): { value: string; status: "original" | "corrected" | "removed" | "expanded" } {
  const correction = [...corrections].reverse().find((item) => item.claimId === claim.id);
  if (!correction || correction.choice === "correct") return { value: claim.value, status: "original" };
  if (correction.choice === "outdated" || correction.choice === "unrelated") {
    return { value: correction.correctedValue.trim(), status: correction.correctedValue.trim() ? "corrected" : "removed" };
  }
  if (correction.choice === "missing") {
    const addition = correction.correctedValue.trim();
    return { value: addition ? `${claim.value}\n${addition}` : claim.value, status: addition ? "expanded" : "original" };
  }
  return { value: correction.correctedValue.trim() || claim.value, status: "corrected" };
}
