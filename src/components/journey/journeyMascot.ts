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
  | "contradiction"
  | "correction"
  | "continued"
  | "complete";

export const phaseToMascot: Record<
  JourneyPhase,
  { state: UlomisState; progress: number; eyes: boolean }
> = {
  fragmented: { state: "forming", progress: 0.3, eyes: false },
  gathering: { state: "forming", progress: 0.45, eyes: false },
  connecting: { state: "attentive", progress: 0.75, eyes: false },
  restored: { state: "holding", progress: 1, eyes: true },
  uncertain: { state: "open", progress: 1, eyes: true },
  contradiction: { state: "correction", progress: 1, eyes: true },
  correction: { state: "correction", progress: 1, eyes: true },
  continued: { state: "holding", progress: 1, eyes: true },
  complete: { state: "confirmed", progress: 1, eyes: true },
};
