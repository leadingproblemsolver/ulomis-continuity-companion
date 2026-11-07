// Founder continuity domain adapter — deterministic and explicitly evidence-limited.
// No API/model calls. Facts here are founder-reported, never independently verified.
export type Source = { id: string; kind: "customer_note" | "development_note" | "founder_choice"; text: string; verification: "founder_reported_unverified" };
export type FounderMode = "continue" | "discover";
export type FounderInput = { mode: FounderMode; objective: string; customerNote: string; developmentNote: string; assumption: string; nextAction?: string; receiptExpected?: string; buyer?: string; friction?: string; access?: "none" | "one" };
export type FounderRecord = {
  schema: "ulomis-founder-continuity/v1";
  mode: FounderMode;
  objective: string;
  sources: Source[];
  observation: string;
  assumption: string;
  uncertainty: string;
  proposedNextAction: string;
  requiredReceipt: string;
  justification: string;
  decision: "suggested" | "accepted_not_executed";
  correction: { previous: string; replacement: string; at: string } | null;
  receipt: { reference: string; at: string; verification: "user_reported_unverified" } | null;
  generatedAt: string;
  acceptedAt: string | null;
};

const clean = (value: string) => value.trim().slice(0, 4000);

export function reconstructFounder(input: FounderInput, timestamp: string = new Date().toISOString()): FounderRecord {
  const objective = clean(input.objective);
  if (input.mode === "continue") {
    const customerNote = clean(input.customerNote);
    const developmentNote = clean(input.developmentNote);
    if (!objective || !customerNote || !developmentNote) throw new Error("Provide the objective and both existing sources.");
    return {
      schema: "ulomis-founder-continuity/v1", mode: "continue", objective,
      sources: [
        { id: "S1", kind: "customer_note", text: customerNote, verification: "founder_reported_unverified" },
        { id: "S2", kind: "development_note", text: developmentNote, verification: "founder_reported_unverified" },
      ],
      observation: "Two founder-supplied source fragments captured. They have not been independently verified.",
      assumption: clean(input.assumption) || "No explicit market assumption supplied.",
      uncertainty: "Source accuracy, actual customer demand, willingness to pay, and execution remain unverified.",
      proposedNextAction: clean(input.nextAction || "") || "Review the reported customer note, confirm its open commitment with the owner, and request a concrete response.",
      requiredReceipt: clean(input.receiptExpected || "") || "A timestamped, inspectable outbound message or participant response",
      justification: "A real external interaction tests the open loop without inventing conclusions from the notes.",
      decision: "suggested", correction: null, receipt: null, generatedAt: timestamp, acceptedAt: null,
    };
  }
  const buyer = clean(input.buyer || "");
  const friction = clean(input.friction || "");
  if (!buyer || !friction) throw new Error("Select a possible buyer and a problem to investigate.");
  const access = input.access === "one" ? "one" : "none";
  return {
    schema: "ulomis-founder-continuity/v1", mode: "discover",
    objective: objective || "Find one testable startup problem",
    sources: [
      { id: "I1", kind: "founder_choice", text: buyer, verification: "founder_reported_unverified" },
      { id: "I2", kind: "founder_choice", text: friction, verification: "founder_reported_unverified" },
    ],
    observation: "Opportunity hypothesis: an operator in " + buyer + " may encounter " + friction + ". No external demand was established.",
    assumption: "This problem is frequent, costly, unsolved by existing alternatives, and worth paying to address.",
    uncertainty: "Problem incidence, operator ownership, urgency, affordability and willingness to pay are unknown.",
    proposedNextAction: access === "one"
      ? "Interview the accessible operator about the most recent real instance, its consequences, and their workaround."
      : "Find one hands-on operator and ask for a recent concrete incident, not feedback on a speculative product.",
    requiredReceipt: "Permissioned first-hand interview note with a dated real incident and workaround",
    justification: "The opportunity remains hypothetical until a real operator independently describes the problem.",
    decision: "suggested", correction: null, receipt: null, generatedAt: timestamp, acceptedAt: null,
  };
}

export function correctFounder(record: FounderRecord, replacement: string, timestamp: string = new Date().toISOString()): FounderRecord {
  const value = clean(replacement);
  if (!value) throw new Error("A substantive correction is required.");
  return {
    ...record,
    assumption: value,
    correction: { previous: record.assumption, replacement: value, at: timestamp },
    decision: "suggested",
    receipt: null,
    acceptedAt: null,
  };
}

export function acceptFounder(record: FounderRecord, timestamp: string = new Date().toISOString()): FounderRecord {
  return { ...record, decision: "accepted_not_executed", acceptedAt: timestamp, receipt: null };
}

export function reportFounderReceipt(record: FounderRecord, reference: string, timestamp: string = new Date().toISOString()): FounderRecord {
  if (record.decision !== "accepted_not_executed") throw new Error("Accept a proposed action first.");
  const value = clean(reference);
  if (!value) throw new Error("Provide a non-sensitive reference.");
  return { ...record, receipt: { reference: value, at: timestamp, verification: "user_reported_unverified" } };
}
