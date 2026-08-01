import type { UlomisState } from "@/components/ulomis/UlomisMark";

/**
 * Every state the mascot can be in during the journey, mapped onto product
 * state — not decoration. Reuses UlomisMark's existing state enum rather than
 * inventing new ones, since idle/forming/attentive/holding/confirmed/open/
 * correction already cover the full range this journey needs.
 */
export type JourneyPhase =
  | "fragmented"
  | "gathering"
  | "connecting"
  | "restored"
  | "uncertain"
  | "contradicted"
  | "corrected"
  | "continued"
  | "completed"
  /** Something is genuinely missing — the loop stays open rather than
   *  inventing continuity that doesn't exist. */
  | "no_match";

export const phaseToMascot: Record<
  JourneyPhase,
  { state: UlomisState; progress: number; eyes: boolean }
> = {
  fragmented: { state: "forming", progress: 0.3, eyes: false },
  gathering: { state: "forming", progress: 0.45, eyes: false },
  connecting: { state: "attentive", progress: 0.75, eyes: false },
  restored: { state: "holding", progress: 1, eyes: true },
  uncertain: { state: "open", progress: 1, eyes: true },
  contradicted: { state: "correction", progress: 1, eyes: true },
  corrected: { state: "correction", progress: 1, eyes: true },
  no_match: { state: "open", progress: 0.85, eyes: false },
  continued: { state: "holding", progress: 1, eyes: true },
  completed: { state: "confirmed", progress: 1, eyes: true },
};
