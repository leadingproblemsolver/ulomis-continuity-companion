import type { UlomisState } from "./UlomisMark";

export interface ContinuityThread {
  id: string;
  label: string;
  kind: string;
  summary: string;
  lastTouched: string;
  settled: string[];
  openLoops: string[];
  corrections: string[];
  resume: string;
  state: UlomisState;
}

export const threads: ContinuityThread[] = [
  {
    id: "plan",
    label: "A plan",
    kind: "Plan",
    summary: "Moving flat, split across three weeks",
    lastTouched: "Paused 11 days ago",
    settled: [
      "Move date agreed for the last weekend of the month",
      "Boxes and packing tape already bought",
      "Old lease end date written down and checked",
    ],
    openLoops: [
      "Van still unbooked — you were comparing two options",
      "No decision yet on what happens to the desk",
    ],
    corrections: ["You changed the date once; the earlier one is no longer valid"],
    resume: "Pick the van back up. Everything else in this plan is already settled.",
    state: "open",
  },
  {
    id: "project",
    label: "A project",
    kind: "Project",
    summary: "Rewriting the onboarding copy",
    lastTouched: "Paused 4 days ago",
    settled: [
      "Tone decided: plain, second person, no exclamation marks",
      "First two screens rewritten and kept",
    ],
    openLoops: [
      "Screen three was half-rewritten mid-sentence",
      "You wanted a second opinion on the closing line",
    ],
    corrections: ["An earlier version used a headline you later rejected"],
    resume: "Continue from the middle of screen three, in the tone you already chose.",
    state: "attentive",
  },
  {
    id: "conversation",
    label: "A conversation",
    kind: "Conversation",
    summary: "Ongoing thread with your landlord",
    lastTouched: "Paused 3 weeks ago",
    settled: ["Repair request acknowledged in writing", "Photos of the damage sent"],
    openLoops: ["No date proposed yet", "You said you'd follow up if nothing arrived in two weeks"],
    corrections: [],
    resume: "The follow-up you promised is now due. The record of what was sent is here.",
    state: "holding",
  },
  {
    id: "responsibility",
    label: "A responsibility",
    kind: "Responsibility",
    summary: "Renewing a document for a family member",
    lastTouched: "Paused 6 days ago",
    settled: ["Correct form identified", "Two of three documents gathered"],
    openLoops: ["One document still missing", "Submission window closes this season"],
    corrections: ["The first form you found was the wrong one and was discarded"],
    resume: "One document short. The rest of the file is intact and where you left it.",
    state: "correction",
  },
];
