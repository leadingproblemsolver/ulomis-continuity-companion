/**
 * Validation instrumentation.
 *
 * No third-party SDK is wired up. Events are pushed onto a queue on `window`,
 * dispatched as a `CustomEvent` so anything on the page can listen without a
 * shared import, and echoed to the console in development. Replacing
 * `deliver` is the only change needed to send these somewhere real.
 */

export type UlomisEvent =
  | "landing_viewed"
  | "ulomis_cta_clicked"
  | "language_changed"
  // Restoration-journey funnel (see docs/journey-gaps.md for the full ladder
  // this is meant to measure against).
  | "journey_recognition_statement_selected"
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
  | "real_thread_first_value_completed"
  | "real_thread_packet_copied"
  | "ulomis_early_access_submitted"
  | "ulomis_referral_created";

export type EventProps = Record<string, string | number | boolean | null>;

export interface TrackedEvent {
  event: UlomisEvent;
  props?: EventProps;
  at: string;
}

declare global {
  interface Window {
    ulomisEvents?: TrackedEvent[];
  }
}

function deliver(payload: TrackedEvent) {
  if (typeof window === "undefined") return;

  window.ulomisEvents = window.ulomisEvents ?? [];
  window.ulomisEvents.push(payload);
  window.dispatchEvent(new CustomEvent("ulomis:event", { detail: payload }));

  if (import.meta.env.DEV) {
    console.debug(`[ulomis] ${payload.event}`, payload.props ?? {});
  }
}

export function track(event: UlomisEvent, props?: EventProps) {
  deliver({ event, props, at: new Date().toISOString() });
}

/**
 * Fires an event at most once per page load. Used for view-level events that
 * would otherwise repeat on re-render or re-entry.
 */
const fired = new Set<string>();

export function trackOnce(event: UlomisEvent, props?: EventProps) {
  const key = `${event}:${JSON.stringify(props ?? {})}`;
  if (fired.has(key)) return;
  fired.add(key);
  track(event, props);
}
