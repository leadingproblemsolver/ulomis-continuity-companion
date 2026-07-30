/**
 * Validation instrumentation.
 *
 * No third-party SDK is wired up. Events are pushed onto a queue on `window`
 * so a real analytics provider can drain them later, and echoed to the console
 * in development. Replacing `deliver` is the only change needed to send these
 * somewhere real.
 */

export type UlomisEvent =
  | "ulomis_viewed"
  | "ulomis_cta_clicked"
  | "ulomis_demo_started"
  | "ulomis_demo_scenario_selected"
  | "ulomis_demo_control_used"
  | "ulomis_demo_completed"
  | "ulomis_demo_dismissed"
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
