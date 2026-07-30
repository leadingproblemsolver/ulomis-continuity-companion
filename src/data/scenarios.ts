/**
 * Deterministic demo content.
 *
 * Nothing here is generated, fetched, or inferred at runtime — the demo is a
 * simulation of the experience, not the engine. Fragments deliberately avoid
 * naming any real product, so the page never implies an integration that
 * doesn't exist.
 *
 * Every connected item records:
 *   - `because`, which powers the "I connected this because…" panel;
 *   - `from`, the fragment ids it rests on, which lets the Correct control
 *     withdraw a fragment and visibly invalidate whatever depended on it.
 */

export type FragmentSource =
  "tab" | "note" | "message" | "email" | "calendar" | "document" | "ai-chat";

export interface Fragment {
  id: string;
  source: FragmentSource;
  label: string;
  detail: string;
  /** Offset applied only in the scattered state, in px / degrees. */
  drift: { x: number; y: number; rotate: number };
}

export interface ConnectedItem {
  text: string;
  because: string;
  from: string[];
}

export interface Scenario {
  id: string;
  label: string;
  blurb: string;
  fragments: Fragment[];
  currentState: ConnectedItem;
  priorDecision: ConnectedItem;
  unresolved: ConnectedItem;
  nextAction: ConnectedItem;
  closingLine: string;
}

export const scenarios: Scenario[] = [
  {
    id: "life",
    label: "My life",
    blurb: "A move you started three weeks ago.",
    fragments: [
      {
        id: "life-tabs",
        source: "tab",
        label: "Two van-hire tabs",
        detail: "Open since 11 days ago",
        drift: { x: -14, y: -10, rotate: -4 },
      },
      {
        id: "life-note",
        source: "note",
        label: "“The desk won't fit the small one”",
        detail: "Written the same evening",
        drift: { x: 12, y: 8, rotate: 3.5 },
      },
      {
        id: "life-calendar",
        source: "calendar",
        label: "Move-out date, changed once",
        detail: "Now the last weekend of the month",
        drift: { x: -8, y: 14, rotate: 2.5 },
      },
      {
        id: "life-email",
        source: "email",
        label: "Lease end confirmation",
        detail: "From the letting agent",
        drift: { x: 16, y: -12, rotate: -3 },
      },
      {
        id: "life-message",
        source: "message",
        label: "Message to Sam about the desk",
        detail: "No reply yet",
        drift: { x: -12, y: -6, rotate: 4 },
      },
      {
        id: "life-chat",
        source: "ai-chat",
        label: "A chat about packing order",
        detail: "You stopped mid-list",
        drift: { x: 10, y: 12, rotate: -2.5 },
      },
    ],
    currentState: {
      text: "You are three weeks into moving flat. The date is fixed and the packing is roughed out. The van is the only thing still genuinely open.",
      because:
        "The calendar entry and the lease confirmation agree on the same date, and the packing chat picks up after it.",
      from: ["life-calendar", "life-email", "life-chat"],
    },
    priorDecision: {
      text: "You already ruled out the cheaper van. Your note says the desk won't fit it.",
      because:
        "That note was written the same evening you opened both hire tabs, and it refers to one of them.",
      from: ["life-note", "life-tabs"],
    },
    unresolved: {
      text: "The van is still unbooked, and Sam never answered about the desk.",
      because: "Both hire tabs are still open, and the message thread has no reply on it.",
      from: ["life-tabs", "life-message"],
    },
    nextAction: {
      text: "Book the larger van for the last weekend of the month. Sam's answer doesn't block it — the desk is why you chose the larger one in the first place.",
      because: "This is the only open item with a date already attached to it.",
      from: ["life-tabs", "life-calendar", "life-note"],
    },
    closingLine: "Ulomis remembered your preference, not just your tabs.",
  },
  {
    id: "work",
    label: "My work",
    blurb: "A rewrite you stopped in the middle of.",
    fragments: [
      {
        id: "work-doc",
        source: "document",
        label: "Onboarding copy draft",
        detail: "Screen three stops mid-sentence",
        drift: { x: -16, y: -8, rotate: -3.5 },
      },
      {
        id: "work-thread",
        source: "message",
        label: "Thread with Priya about tone",
        detail: "Four days ago",
        drift: { x: 14, y: 10, rotate: 3 },
      },
      {
        id: "work-tabs",
        source: "tab",
        label: "Three reference tabs",
        detail: "Other onboarding flows",
        drift: { x: -10, y: 13, rotate: 2 },
      },
      {
        id: "work-chat",
        source: "ai-chat",
        label: "A chat exploring openings",
        detail: "Eleven variations, none kept",
        drift: { x: 12, y: -13, rotate: -2.5 },
      },
      {
        id: "work-calendar",
        source: "calendar",
        label: "Copy review, Thursday",
        detail: "Already in the calendar",
        drift: { x: -13, y: -5, rotate: 4 },
      },
      {
        id: "work-note",
        source: "note",
        label: "“Plain. Second person. No exclamation marks.”",
        detail: "From the tone discussion",
        drift: { x: 9, y: 11, rotate: -3 },
      },
    ],
    currentState: {
      text: "You are rewriting the onboarding copy. Screens one and two are finished and kept. Screen three stops mid-sentence.",
      because:
        "The draft's own edit history ends inside screen three, and nothing after it has been touched.",
      from: ["work-doc"],
    },
    priorDecision: {
      text: "The tone was already settled with Priya: plain, second person, no exclamation marks. Eleven alternative openings were explored afterwards and none of them replaced it.",
      because:
        "Your note repeats the conclusion of the tone thread, and the later chat never contradicted it.",
      from: ["work-note", "work-thread", "work-chat"],
    },
    unresolved: {
      text: "Screen three is unfinished, and the closing line is still waiting for the second opinion you asked for.",
      because: "You asked Priya for a read on the closing line and the thread has no answer yet.",
      from: ["work-doc", "work-thread"],
    },
    nextAction: {
      text: "Continue screen three in the tone you already chose, then send the closing line to Priya before Thursday's review.",
      because: "The review is the nearest fixed point, and the closing line is what it depends on.",
      from: ["work-doc", "work-calendar", "work-note"],
    },
    closingLine: "Ulomis restores the state of the work—not merely the files.",
  },
  {
    id: "household",
    label: "My household",
    blurb: "A repair that nobody has scheduled.",
    fragments: [
      {
        id: "house-thread",
        source: "message",
        label: "Thread with the landlord",
        detail: "Last reply three weeks ago",
        drift: { x: -12, y: -12, rotate: -3 },
      },
      {
        id: "house-photos",
        source: "document",
        label: "Photos of the damage",
        detail: "Sent and acknowledged",
        drift: { x: 15, y: 7, rotate: 3.5 },
      },
      {
        id: "house-email",
        source: "email",
        label: "Repair request acknowledged",
        detail: "No date proposed",
        drift: { x: -9, y: 12, rotate: 2 },
      },
      {
        id: "house-note",
        source: "note",
        label: "“Follow up if nothing in two weeks”",
        detail: "Your own words",
        drift: { x: 13, y: -9, rotate: -4 },
      },
      {
        id: "house-calendar",
        source: "calendar",
        label: "A reminder that already passed",
        detail: "Dismissed, then forgotten",
        drift: { x: -14, y: 5, rotate: 3 },
      },
      {
        id: "house-tab",
        source: "tab",
        label: "Tenancy rights page",
        detail: "Read once, never returned to",
        drift: { x: 10, y: 13, rotate: -2 },
      },
    ],
    currentState: {
      text: "The repair was acknowledged in writing and then went quiet. Nothing has been scheduled.",
      because:
        "The acknowledgement is the last thing on the thread, and no date appears anywhere after it.",
      from: ["house-thread", "house-email"],
    },
    priorDecision: {
      text: "You decided to give it two weeks before chasing, and you wrote that down rather than trusting it to memory.",
      because: "Your note sets the two-week wait, and the reminder was set to match it.",
      from: ["house-note", "house-calendar"],
    },
    unresolved: {
      text: "Three weeks have passed. No date has been proposed, and the follow-up you promised yourself was never sent.",
      because:
        "The wait you set has elapsed, the reminder was dismissed, and the thread has had nothing new on it since.",
      from: ["house-note", "house-calendar", "house-thread"],
    },
    nextAction: {
      text: "Send the follow-up on the existing thread, where the photos and the acknowledgement already sit. Nothing needs restating.",
      because:
        "Everything the follow-up needs to reference is already on that one thread, so it costs a sentence rather than an evening.",
      from: ["house-thread", "house-photos", "house-email"],
    },
    closingLine: "Ulomis turns scattered coordination into one calm next step.",
  },
];

export const defaultScenarioId = scenarios[0].id;

export function getScenario(id: string): Scenario {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}
