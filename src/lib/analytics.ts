/* eslint-disable prettier/prettier */
export type UlomisEventName =
  | "landing_viewed"
  | "scenario_selected"
  | "demo_started"
  | "restoration_completed"
  | "why_opened"
  | "item_confirmed"
  | "item_corrected"
  | "item_dismissed"
  | "contradiction_resolved"
  | "next_action_selected"
  | "demo_first_value_completed"
  | "real_thread_started"
  | "thread_saved"
  | "thread_deferred"
  | "thread_completed"
  | "thread_resumed"
  | "thread_reopened"
  | "continuity_exported"
  | "local_data_deleted"
  | "language_changed";

export type UlomisEventMetadata = {
  scenario?: "work" | "life" | "household";
  language?: "en" | "ar";
  correctionType?: string;
  sessionId?: string;
  pilotId?: string;
  pilotStage?: string;
  sourceCount?: number;
  attachmentCount?: number;
  claimCount?: number;
  normalReentryMinutes?: number;
  normalSources?: number;
  normalPeople?: number;
  actualReentrySeconds?: number;
  sourcesReopened?: number;
  peopleContacted?: number;
  correctionsCount?: number;
  changedNextAction?: boolean;
  returnWindowDays?: number;
  complete?: boolean;
  sourceKind?: string;
  sourceStatus?: string;
  fileSize?: number;
  counter?: string;
  delta?: number;
  decision?: string;
  [key: string]: string | number | boolean | null | undefined;
};

const SESSION_KEY = "ulomis-demo-session";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const created = globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    window.sessionStorage.setItem(SESSION_KEY, created);
  } catch {
    // Analytics must never break the product when browser storage is unavailable.
  }
  return created;
}

export function trackEvent(name: UlomisEventName | string, metadata: UlomisEventMetadata = {}) {
  if (typeof window === "undefined") return;

  const detail = {
    name,
    metadata: {
      ...metadata,
      sessionId: metadata.sessionId ?? getSessionId(),
      timestamp: new Date().toISOString(),
    },
  };

  window.dispatchEvent(new CustomEvent("ulomis:event", { detail }));

  if (import.meta.env.DEV) {
    console.info("[Ulomis event]", detail);
  }
}
