// Unit tests for Assessment Guard core logic. Run: TZ=Asia/Qatar node --test test/
// All fixtures are SYNTHETIC. No real assessment dates or grades.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core.js";

const NOW = new Date("2026-10-17T12:00:00Z"); // fixed clock
const H = 3600 * 1000;

const goodInput = {
  course: "infs1101",
  type: "Quiz",
  title: "",
  when: "2026-10-24T10:00",
  status: "verified",
  sourceType: "D2L announcement",
  sourceRef: "SYNTHETIC: 'Quiz 3 date' announcement",
  location: "",
};

const rec = (over = {}) => {
  const v = C.validateAssessmentInput({ ...goodInput, ...over }, NOW);
  assert.ok(v.ok, JSON.stringify(v.errors));
  return { id: C.newId(1, () => 0.5), sequence: 0, ...v.value };
};

// ---- Acceptance 1/2/3: validation ----
test("valid input normalises and stamps checkedAt", () => {
  const v = C.validateAssessmentInput(goodInput, NOW);
  assert.equal(v.ok, true);
  assert.equal(v.value.course, "INFS1101");
  assert.equal(v.value.checkedAt, NOW.toISOString());
  assert.equal(v.value.status, "verified");
});

test("missing or malformed date is rejected", () => {
  for (const when of [
    "",
    "2026-10-24",
    "24/10/2026 10:00",
    "2026-13-01T10:00",
    "2026-02-30T10:00",
    null,
  ]) {
    const v = C.validateAssessmentInput({ ...goodInput, when }, NOW);
    assert.equal(v.ok, false, `accepted ${when}`);
    assert.ok(v.errors.when);
  }
});

test("verified without source type or reference is rejected — no false verified", () => {
  let v = C.validateAssessmentInput({ ...goodInput, sourceType: "" }, NOW);
  assert.equal(v.ok, false);
  assert.ok(v.errors.sourceType);
  v = C.validateAssessmentInput({ ...goodInput, sourceRef: "   " }, NOW);
  assert.equal(v.ok, false);
  assert.ok(v.errors.sourceRef);
  v = C.validateAssessmentInput({ ...goodInput, sourceType: "Made up source" }, NOW);
  assert.equal(v.ok, false);
});

test("unverified entries are allowed without a source but stay unverified", () => {
  const v = C.validateAssessmentInput(
    { ...goodInput, status: "unverified", sourceType: "", sourceRef: "" },
    NOW,
  );
  assert.equal(v.ok, true);
  assert.equal(v.value.status, "unverified");
  assert.ok(
    C.attentionFlags({ ...v.value }, NOW).includes("Not verified against an official source"),
  );
});

test("'Other' type requires a name; unknown type rejected", () => {
  assert.equal(C.validateAssessmentInput({ ...goodInput, type: "Other" }, NOW).ok, false);
  assert.equal(
    C.validateAssessmentInput({ ...goodInput, type: "Other", title: "Project demo" }, NOW).ok,
    true,
  );
  assert.equal(C.validateAssessmentInput({ ...goodInput, type: "<script>" }, NOW).ok, false);
});

test("control characters are stripped from text fields", () => {
  const v = C.validateAssessmentInput({ ...goodInput, location: "Room\n1\u0000A" }, NOW);
  assert.equal(v.value.location, "Room 1 A");
});

// ---- Timezone ----
test("local wall-clock time is converted to the right UTC instant (TZ=Asia/Qatar, UTC+3)", () => {
  if (C.localTimeZoneName() !== "Asia/Qatar") return; // only meaningful under the CI TZ
  const v = C.validateAssessmentInput(goodInput, NOW);
  assert.equal(v.value.startUtc, "2026-10-24T07:00:00.000Z");
  assert.equal(C.utcOffsetLabel(new Date(v.value.startUtc)), "UTC+03:00");
});

test("nonexistent DST wall-clock time is rejected (TZ=America/New_York only)", () => {
  if (C.localTimeZoneName() !== "America/New_York") return;
  const r = C.parseLocalDateTime("2026-03-08T02:30");
  assert.equal(r.ok, false);
});

// ---- Duplicates ----
test("duplicate detection uses course+type+title+instant", () => {
  const a = rec();
  assert.equal(C.isDuplicate([a], { ...a, id: "other" }), true);
  assert.equal(C.isDuplicate([a], { ...a, id: "other", title: "Quiz 4" }), false);
  assert.equal(C.isDuplicate([a], { ...a }, a.id), false, "editing itself is not a duplicate");
});

// ---- Acceptance 4: status transitions with a fixed clock ----
test("time state boundaries", () => {
  const at = (ms) => new Date(NOW.getTime() + ms).toISOString();
  assert.equal(C.timeState(at(-1), NOW), "overdue");
  assert.equal(C.timeState(at(0), NOW), "within24h");
  assert.equal(C.timeState(at(24 * H), NOW), "within24h");
  assert.equal(C.timeState(at(24 * H + 1), NOW), "within48h");
  assert.equal(C.timeState(at(48 * H), NOW), "within48h");
  assert.equal(C.timeState(at(48 * H + 1), NOW), "within7d");
  assert.equal(C.timeState(at(7 * 24 * H), NOW), "within7d");
  assert.equal(C.timeState(at(7 * 24 * H + 1), NOW), "later");
  assert.equal(C.timeState("garbage", NOW), "overdue");
});

test("attention flags: unverified, calendar unconfirmed, stale after edit; none when settled", () => {
  const a = rec({ when: "2026-11-30T10:00" });
  assert.deepEqual(C.attentionFlags(a, NOW), ["Not yet confirmed in your calendar app"]);
  const settled = { ...a, calendarConfirmedAt: NOW.toISOString() };
  assert.deepEqual(C.attentionFlags(settled, NOW), []);
  assert.equal(C.needsAttention(settled, NOW), false);
  const stale = { ...settled, calendarStale: true };
  assert.equal(C.attentionFlags(stale, NOW).length, 1);
});

test("sort and filter", () => {
  const late = {
    ...rec({ when: "2026-12-01T10:00" }),
    id: "late",
    calendarConfirmedAt: NOW.toISOString(),
  };
  const soon = { ...rec({ when: "2026-10-18T10:00" }), id: "soon" };
  const past = { ...rec({ when: "2026-10-01T10:00" }), id: "past" };
  const list = [late, past, soon];
  assert.deepEqual(
    C.filterAssessments(list, "all", NOW).map((a) => a.id),
    ["past", "soon", "late"],
  );
  assert.deepEqual(
    C.filterAssessments(list, "upcoming", NOW).map((a) => a.id),
    ["soon", "late"],
  );
  assert.deepEqual(
    C.filterAssessments(list, "past", NOW).map((a) => a.id),
    ["past"],
  );
  assert.deepEqual(
    C.filterAssessments(list, "attention", NOW).map((a) => a.id),
    ["soon"],
  );
});

// ---- Acceptance 9: malformed storage / import ----
test("parseStore never throws and drops untrustworthy records", () => {
  assert.deepEqual(C.parseStore(null), { ok: true, assessments: [], dropped: 0 });
  assert.equal(C.parseStore("{not json").ok, false);
  assert.equal(C.parseStore('{"foo":1}').ok, false);
  assert.equal(C.parseStore(JSON.stringify({ schema: 99, assessments: [] })).ok, false);
  const good = rec();
  const r = C.parseStore(
    JSON.stringify({
      schema: 2,
      assessments: [
        good,
        good, // duplicate id
        { ...good, id: "x", startUtc: "nope" },
        { ...good, id: "y", type: "<img src=x onerror=alert(1)>" },
        { ...good, id: "bad id with spaces" },
        null,
        42,
      ],
    }),
  );
  assert.equal(r.ok, true);
  assert.equal(r.assessments.length, 1);
  assert.equal(r.dropped, 6);
});

test("imported 'verified' without evidence is downgraded to unverified", () => {
  const r = C.parseStore(JSON.stringify([{ ...rec(), sourceRef: "" }]));
  assert.equal(r.assessments[0].status, "unverified");
});

test("backup round-trips and merge skips duplicates", () => {
  const a = rec();
  const b = { ...rec({ when: "2026-11-02T09:00", type: "Lab" }), id: "b" };
  const text = C.serializeStore([a, b], NOW);
  const back = C.parseStore(text);
  assert.deepEqual(
    back.assessments.map((x) => x.id),
    [a.id, "b"],
  );
  const merged = C.mergeImport([a], back.assessments);
  assert.equal(merged.added, 1);
  assert.equal(merged.skipped, 1);
});

// ---- Acceptance 5: calendar output ----
test("ICS escapes text, folds long lines, has UID/SEQUENCE/UTC times and 3 requested alarms", () => {
  const a = {
    ...rec({
      sourceRef:
        "SYNTHETIC; tricky, text \\ with\nnewline and a very long reference that definitely exceeds seventy-five octets — ✓ مرحبا",
      location: "Room A, Block; 2",
    }),
    id: "ag-test-1",
    sequence: 2,
  };
  const ics = C.buildIcs([a], NOW);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  const enc = new TextEncoder();
  for (const line of ics.split("\r\n"))
    assert.ok(enc.encode(line).length <= 75, `line too long: ${line}`);
  assert.ok(!/[^\r]\n/.test(ics), "bare LF found");
  const [ev] = C.parseIcs(ics);
  assert.equal(ev.UID, "ag-test-1@assessment-guard.invalid");
  assert.equal(ev.SEQUENCE, "2");
  assert.match(ev.DTSTART, /^\d{8}T\d{6}Z$/);
  assert.equal(
    new Date(a.startUtc).getTime(),
    Date.parse(
      ev.DTSTART.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z"),
    ),
  );
  assert.equal(ev.LOCATION, "Room A, Block; 2");
  assert.ok(
    ev.DESCRIPTION.includes("tricky, text \\ with newline"),
    "control chars become spaces at input",
  );
  assert.ok(ev.DESCRIPTION.includes("\nReconfirm"), "multi-line description escaped and restored");
  assert.ok(ev.DESCRIPTION.includes("مرحبا"));
  assert.deepEqual(ev.alarms, ["-P7D", "-PT48H", "-PT24H"]);
  assert.equal(ev.SUMMARY, "INFS1101 Quiz");
});

test("ICS marks unverified events in the title", () => {
  const a = { ...rec({ status: "unverified", sourceType: "", sourceRef: "" }), id: "u1" };
  const [ev] = C.parseIcs(C.buildIcs([a], NOW));
  assert.ok(ev.SUMMARY.startsWith("[UNVERIFIED] "));
});

test("foldLine leaves short lines alone and never splits a multi-byte character", () => {
  assert.equal(C.foldLine("SHORT:x"), "SHORT:x");
  const folded = C.foldLine("D:" + "é".repeat(100));
  for (const part of folded.split("\r\n")) assert.ok(new TextEncoder().encode(part).length <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), "D:" + "é".repeat(100));
});

// ---- Acceptance 7: grade math ----
test("midterm 0 + remaining 80% at 75% => exactly 60%", () => {
  const s = { final: null, midterm: 0, labs: null, quizzes: null, tests: null };
  assert.equal(C.projectTotal(s, 75), 60);
  const a = C.gradeAnalysis(s);
  assert.equal(a.earned, 0);
  assert.equal(a.remainingWeight, 80);
  assert.equal(a.required, 75);
  assert.equal(a.feasibility, "possible");
});

test("all components 100 => 100%, target met", () => {
  const s = { final: 100, midterm: 100, labs: 100, quizzes: 100, tests: 100 };
  const a = C.gradeAnalysis(s);
  assert.equal(a.earned, 100);
  assert.equal(a.remainingWeight, 0);
  assert.equal(a.feasibility, "met");
});

test("impossible and already-secured cases", () => {
  const imp = C.gradeAnalysis({ final: null, midterm: 0, labs: 0, quizzes: 0, tests: 0 });
  assert.equal(imp.required, 171.43);
  assert.equal(imp.feasibility, "impossible");
  const sec = C.gradeAnalysis({ final: null, midterm: 100, labs: 100, quizzes: 100, tests: 100 });
  assert.equal(sec.feasibility, "already-secured");
  const t = C.gradeAnalysis(
    { final: null, midterm: null, labs: null, quizzes: null, tests: null },
    101,
  );
  assert.equal(t.feasibility, "impossible", "target above 100 is flagged");
});

test("weights match the INFS1101 master syllabus and sum to 100", () => {
  assert.deepEqual(
    { ...C.INFS1101_WEIGHTS },
    { final: 35, midterm: 20, labs: 10, quizzes: 15, tests: 20 },
  );
  assert.equal(
    Object.values(C.INFS1101_WEIGHTS).reduce((x, y) => x + y, 0),
    100,
  );
  assert.equal(C.INFS1101_PASS, 60);
});

test("parseScore rejects invalid values; blank means not entered (never an assumed 0)", () => {
  assert.deepEqual(C.parseScore(""), { ok: true, value: null });
  assert.deepEqual(C.parseScore("75"), { ok: true, value: 75 });
  assert.deepEqual(C.parseScore("0"), { ok: true, value: 0 });
  for (const bad of ["-1", "101", "abc", "1e2", "50%", "NaN"])
    assert.equal(C.parseScore(bad).ok, false, bad);
});

// ---- Acceptance 1: synthetic demo is labelled ----
test("synthetic demo records are all labelled SYNTHETIC and use a non-real course", () => {
  for (const a of C.syntheticAssessments(NOW)) {
    assert.equal(a.synthetic, true);
    assert.equal(a.course, "DEMO101");
    assert.equal(a.title, "SYNTHETIC");
    assert.ok(C.sanitizeRecord(a));
  }
});
