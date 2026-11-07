import assert from "node:assert/strict";
import test from "node:test";
import {
  reconstructFounder, correctFounder, acceptFounder, reportFounderReceipt,
} from "../src/lib/founder-continuity.ts";

const input = {
  mode: "continue", objective: "Validate one real pilot",
  customerNote: "A prospect reportedly requested a demo",
  developmentNote: "Demo reportedly uses synthetic cases",
  assumption: "Prospect will pay",
};
const at = "2026-11-07T09:00:00.000Z";

test("two sources retained with explicit unverified status", () => {
  const result = reconstructFounder(input, at);
  assert.equal(result.sources.length, 2);
  assert.equal(result.sources[0].id, "S1");
  assert.equal(result.sources[1].id, "S2");
  assert.equal(result.sources[0].verification, "founder_reported_unverified");
  assert.equal(result.decision, "suggested");
  assert.equal(result.receipt, null);
});
test("missing inputs cannot create confident reconstruction", () => {
  assert.throws(() => reconstructFounder({...input, customerNote: ""}), /both existing sources/);
  assert.throws(() => reconstructFounder({...input, objective: ""}), /both existing sources/);
});
test("assumption is not promoted into a verified claim", () => {
  const result = reconstructFounder(input, at);
  assert.equal(result.assumption, "Prospect will pay");
  assert.match(result.uncertainty, /willingness to pay/);
  assert.doesNotMatch(result.observation, /Prospect will pay/);
});
test("human correction preserves previous content and resets acceptance", () => {
  const accepted = acceptFounder(reconstructFounder(input, at), at);
  const revised = correctFounder(accepted, "Willingness to pay is unknown", at);
  assert.equal(revised.correction.previous, "Prospect will pay");
  assert.equal(revised.correction.replacement, "Willingness to pay is unknown");
  assert.equal(revised.decision, "suggested");
  assert.equal(revised.acceptedAt, null);
  assert.equal(revised.receipt, null);
});
test("empty correction cannot erase uncertain state", () => {
  assert.throws(() => correctFounder(reconstructFounder(input), "  "), /substantive/);
});
test("acceptance remains explicitly unexecuted", () => {
  const result = acceptFounder(reconstructFounder(input), at);
  assert.equal(result.decision, "accepted_not_executed");
  assert.equal(result.receipt, null);
});
test("receipt rejected without human approval", () => {
  assert.throws(() => reportFounderReceipt(reconstructFounder(input), "email#1"), /Accept/);
});
test("receipt remains user reported even with reference", () => {
  const result = reportFounderReceipt(acceptFounder(reconstructFounder(input)), "email#1", at);
  assert.equal(result.receipt.verification, "user_reported_unverified");
  assert.equal(result.decision, "accepted_not_executed");
});
test("idea discovery is hypothesis, not proof", () => {
  const result = reconstructFounder({
    mode: "discover", objective: "", buyer: "Small retailers",
    friction: "Records disagree", access: "none",
    customerNote: "", developmentNote: "", assumption: "",
  }, at);
  assert.equal(result.mode, "discover");
  assert.match(result.observation, /hypothesis/i);
  assert.match(result.uncertainty, /unknown/i);
  assert.match(result.proposedNextAction, /Find one hands-on operator/);
  assert.equal(result.receipt, null);
});
test("access changes interview step, not validation tier", () => {
  const result = reconstructFounder({
    mode: "discover", objective: "", buyer: "University clubs",
    friction: "Handoffs fail", access: "one",
    customerNote: "", developmentNote: "", assumption: "",
  }, at);
  assert.match(result.proposedNextAction, /Interview the accessible operator/);
  assert.equal(result.decision, "suggested");
});
test("no buyer/problem means no opportunity claim", () => {
  assert.throws(() => reconstructFounder({
    mode: "discover", objective: "", buyer: "", friction: "", access: "none",
    customerNote: "", developmentNote: "", assumption: "",
  }), /Select a possible buyer/);
});
test("long payload cannot bypass limits", () => {
  const result = reconstructFounder({...input, customerNote: "a".repeat(6000)});
  assert.equal(result.sources[0].text.length, 4000);
});
