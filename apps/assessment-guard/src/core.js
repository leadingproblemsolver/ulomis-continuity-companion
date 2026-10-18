// Assessment Guard — pure logic (no DOM). Every function here is unit-tested in test/core.test.js.
// CLO2 (control structures) and CLO3 (algorithm design) live mostly in this file.

export const SCHEMA_VERSION = 2;
export const STORAGE_KEY = "assessment_guard_v2";
export const DEMO_STORAGE_KEY = "assessment_guard_demo_v2";

export const ASSESSMENT_TYPES = ["Midterm Exam", "Final Exam", "Quiz", "Test", "Lab", "Other"];
export const SOURCE_TYPES = [
  "D2L announcement",
  "Instructor email",
  "Instructor-provided schedule",
  "Other official confirmation",
];

// INFS1101 Fall 2026 Course Master Syllabus — assessment weighting (weights only, no dates).
export const INFS1101_WEIGHTS = Object.freeze({
  final: 35,
  midterm: 20,
  labs: 10,
  quizzes: 15,
  tests: 20,
});
export const INFS1101_PASS = 60;
export const COMPONENT_LABELS = Object.freeze({
  final: "Final exam",
  midterm: "Midterm exam",
  labs: "Labs",
  quizzes: "Quizzes",
  tests: "Tests",
});

const HOUR = 3600 * 1000;
const MAX_TEXT = 200;

// ---------- Time ----------

/** Parse "YYYY-MM-DDTHH:mm" as a wall-clock time in the runtime's local timezone.
 *  Returns { ok, date, error }. Rejects malformed strings and wall-clock times that do not
 *  exist locally (e.g. skipped by a daylight-saving jump) by round-tripping the parts. */
export function parseLocalDateTime(value) {
  if (typeof value !== "string") return { ok: false, error: "Enter a date and time." };
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return { ok: false, error: "Enter a date and time (both are required)." };
  const [, y, mo, d, h, mi] = m.map(Number);
  if (y < 2000 || y > 2100) return { ok: false, error: "Year must be between 2000 and 2100." };
  const date = new Date(y, mo - 1, d, h, mi, 0, 0);
  const roundTrips =
    date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d &&
    date.getHours() === h &&
    date.getMinutes() === mi;
  if (!roundTrips) {
    return {
      ok: false,
      error:
        "That date/time does not exist in your timezone (invalid day, or skipped by a clock change).",
    };
  }
  return { ok: true, date };
}

/** Format a Date back to the datetime-local input format in local time. */
export function toLocalInputValue(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function localTimeZoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
  } catch {
    return "local time";
  }
}

/** "UTC+03:00" style offset for a given instant in local time. */
export function utcOffsetLabel(date) {
  const mins = -date.getTimezoneOffset();
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

// ---------- Validation ----------

function cleanText(value, max = MAX_TEXT) {
  if (value === undefined || value === null) return "";
  // Strip control characters; keep it as plain text. Rendering always escapes.
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

/** Validate raw form input. Returns { ok, value, errors: {field: message} }.
 *  Verified status requires a source type AND a reference the student can re-check. */
export function validateAssessmentInput(raw, now = new Date()) {
  const errors = {};
  const course = cleanText(raw.course, 20).toUpperCase() || "INFS1101";
  if (!/^[A-Z0-9 -]{2,20}$/.test(course))
    errors.course = "Course code: letters, digits, spaces or hyphens.";

  const type = ASSESSMENT_TYPES.includes(raw.type) ? raw.type : null;
  if (!type) errors.type = "Choose an assessment type.";

  const title = cleanText(raw.title, 80);
  if (type === "Other" && !title) errors.title = "Give this assessment a name.";

  const parsed = parseLocalDateTime(raw.when);
  if (!parsed.ok) errors.when = parsed.error;

  const status = raw.status === "verified" ? "verified" : "unverified";
  const sourceType = SOURCE_TYPES.includes(raw.sourceType) ? raw.sourceType : "";
  const sourceRef = cleanText(raw.sourceRef, MAX_TEXT);
  if (status === "verified") {
    if (!sourceType) errors.sourceType = "To mark as verified, choose where you checked it.";
    if (!sourceRef)
      errors.sourceRef =
        "To mark as verified, note the announcement title, email subject or link you checked.";
  }
  const location = cleanText(raw.location, 120);

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    errors: {},
    value: {
      course,
      type,
      title,
      startUtc: parsed.date.toISOString(),
      localInput: toLocalInputValue(parsed.date),
      timeZone: localTimeZoneName(),
      status,
      sourceType,
      sourceRef,
      location,
      checkedAt: now.toISOString(),
    },
  };
}

export function displayName(a) {
  return a.title ? `${a.type}: ${a.title}` : a.type;
}

/** Duplicate = same course + type + title (case-insensitive) + same instant. */
export function isDuplicate(list, candidate, ignoreId) {
  const key = (a) => `${a.course}|${a.type}|${(a.title || "").toLowerCase()}|${a.startUtc}`;
  const k = key(candidate);
  return list.some((a) => a.id !== ignoreId && key(a) === k);
}

export function newId(now = Date.now(), rand = Math.random) {
  return `ag-${now.toString(36)}-${Math.floor(rand() * 1e9).toString(36)}`;
}

// ---------- Risk status (CLO2: selection) ----------

export const TIME_STATES = ["overdue", "within24h", "within48h", "within7d", "later"];
export const TIME_LABELS = {
  overdue: "Date has passed — check status with your instructor",
  within24h: "Within 24 hours",
  within48h: "Within 48 hours",
  within7d: "Within 7 days",
  later: "Later",
};

/** Boundaries: exactly 24h away counts as within24h; exactly at start time is not overdue. */
export function timeState(startUtc, now = new Date()) {
  const diff = new Date(startUtc).getTime() - now.getTime();
  if (!Number.isFinite(diff)) return "overdue";
  if (diff < 0) return "overdue";
  if (diff <= 24 * HOUR) return "within24h";
  if (diff <= 48 * HOUR) return "within48h";
  if (diff <= 7 * 24 * HOUR) return "within7d";
  return "later";
}

/** All flags a student should act on, as plain text (never colour-only). */
export function attentionFlags(a, now = new Date()) {
  const flags = [];
  const t = timeState(a.startUtc, now);
  if (a.status !== "verified") flags.push("Not verified against an official source");
  if (t !== "overdue" && !a.calendarConfirmedAt)
    flags.push("Not yet confirmed in your calendar app");
  if (t !== "overdue" && a.calendarStale)
    flags.push("Changed after export — update the event in your calendar yourself");
  return flags;
}

export function needsAttention(a, now = new Date()) {
  const t = timeState(a.startUtc, now);
  return t === "within24h" || t === "within48h" || attentionFlags(a, now).length > 0;
}

export function sortChronological(list) {
  return list.slice().sort((a, b) => new Date(a.startUtc) - new Date(b.startUtc));
}

export function filterAssessments(list, filter, now = new Date()) {
  const sorted = sortChronological(list);
  switch (filter) {
    case "attention":
      return sorted.filter((a) => needsAttention(a, now));
    case "upcoming":
      return sorted.filter((a) => timeState(a.startUtc, now) !== "overdue");
    case "past":
      return sorted.filter((a) => timeState(a.startUtc, now) === "overdue");
    default:
      return sorted;
  }
}

// ---------- Persistence / backup (schema-checked) ----------

/** Coerce one stored record; returns null if it cannot be trusted. */
export function sanitizeRecord(r) {
  if (!r || typeof r !== "object") return null;
  if (typeof r.id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(r.id)) return null;
  if (!ASSESSMENT_TYPES.includes(r.type)) return null;
  if (typeof r.startUtc !== "string" || !Number.isFinite(new Date(r.startUtc).getTime()))
    return null;
  const status = r.status === "verified" ? "verified" : "unverified";
  const sourceType = SOURCE_TYPES.includes(r.sourceType) ? r.sourceType : "";
  const sourceRef = cleanText(r.sourceRef);
  const okIso = (v) => (typeof v === "string" && Number.isFinite(new Date(v).getTime()) ? v : null);
  return {
    id: r.id,
    course: cleanText(r.course, 20).toUpperCase() || "INFS1101",
    type: r.type,
    title: cleanText(r.title, 80),
    startUtc: new Date(r.startUtc).toISOString(),
    localInput: typeof r.localInput === "string" ? r.localInput : "",
    timeZone: cleanText(r.timeZone, 64),
    // A record claiming "verified" without its evidence is downgraded, never trusted.
    status: status === "verified" && sourceType && sourceRef ? "verified" : "unverified",
    sourceType,
    sourceRef,
    location: cleanText(r.location, 120),
    checkedAt: okIso(r.checkedAt),
    sequence: Number.isInteger(r.sequence) && r.sequence >= 0 ? r.sequence : 0,
    exportedAt: okIso(r.exportedAt),
    calendarConfirmedAt: okIso(r.calendarConfirmedAt),
    calendarStale: Boolean(r.calendarStale),
    synthetic: Boolean(r.synthetic),
  };
}

/** Parse stored/imported JSON. Accepts {schema, assessments:[...]} or a bare array.
 *  Returns { ok, assessments, dropped, error }. Never throws. */
export function parseStore(text) {
  if (text === null || text === undefined || text === "")
    return { ok: true, assessments: [], dropped: 0 };
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, assessments: [], dropped: 0, error: "File is not valid JSON." };
  }
  const arr = Array.isArray(data)
    ? data
    : data && Array.isArray(data.assessments)
      ? data.assessments
      : null;
  if (!arr)
    return { ok: false, assessments: [], dropped: 0, error: "No assessments list found in file." };
  if (!Array.isArray(data) && data.schema !== undefined && data.schema > SCHEMA_VERSION)
    return {
      ok: false,
      assessments: [],
      dropped: 0,
      error: "Backup is from a newer version of this tool.",
    };
  const out = [];
  const seen = new Set();
  let dropped = 0;
  for (const r of arr) {
    const clean = sanitizeRecord(r);
    if (!clean || seen.has(clean.id)) {
      dropped++;
      continue;
    }
    seen.add(clean.id);
    out.push(clean);
  }
  return { ok: true, assessments: out, dropped };
}

export function serializeStore(assessments, now = new Date()) {
  return JSON.stringify(
    { schema: SCHEMA_VERSION, app: "assessment-guard", exportedAt: now.toISOString(), assessments },
    null,
    2,
  );
}

/** Merge imported records into current list: skip same id and exact duplicates. */
export function mergeImport(current, incoming) {
  const result = current.slice();
  let added = 0;
  let skipped = 0;
  for (const r of incoming) {
    if (result.some((a) => a.id === r.id) || isDuplicate(result, r)) {
      skipped++;
      continue;
    }
    result.push(r);
    added++;
  }
  return { assessments: result, added, skipped };
}

// ---------- iCalendar (RFC 5545) ----------

export function icsEscape(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Fold content lines at 75 octets (UTF-8 aware), continuation lines start with a space. */
export function foldLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = "";
  let curBytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > limit) {
      parts.push(cur);
      cur = "";
      curBytes = 0;
      limit = 74; // leading space consumes one octet
    }
    cur += ch;
    curBytes += b;
  }
  parts.push(cur);
  return parts.join("\r\n ");
}

export function icsUtcStamp(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export const REQUESTED_ALARMS = [
  { trigger: "-P7D", text: "in 7 days" },
  { trigger: "-PT48H", text: "in 48 hours" },
  { trigger: "-PT24H", text: "in 24 hours" },
];

/** Build a VCALENDAR. Times are written in UTC (Z), so every calendar app converts them to the
 *  viewer's timezone unambiguously — no VTIMEZONE needed, and DST is resolved at entry time. */
export function buildIcs(assessments, now = new Date(), durationMinutes = 60) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Assessment Guard (independent student tool)//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const a of assessments) {
    const start = new Date(a.startUtc);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const name = `${a.course} ${displayName(a)}`;
    const desc = [
      a.status === "verified"
        ? `Marked verified by you via ${a.sourceType}: ${a.sourceRef}`
        : "UNVERIFIED — not yet checked against an official source.",
      "Reconfirm the date/time in D2L or with your instructor. This is an unofficial reminder.",
    ].join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${a.id}@assessment-guard.invalid`,
      `SEQUENCE:${a.sequence || 0}`,
      `DTSTAMP:${icsUtcStamp(now)}`,
      `DTSTART:${icsUtcStamp(start)}`,
      `DTEND:${icsUtcStamp(end)}`,
      `SUMMARY:${icsEscape((a.status === "verified" ? "" : "[UNVERIFIED] ") + name)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
    );
    if (a.location) lines.push(`LOCATION:${icsEscape(a.location)}`);
    for (const al of REQUESTED_ALARMS) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `TRIGGER:${al.trigger}`,
        `DESCRIPTION:${icsEscape(`${name} ${al.text}`)}`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Minimal RFC 5545 reader used by tests to prove our own output round-trips. */
export function parseIcs(text) {
  const unfolded = text.replace(/\r\n[ \t]/g, "");
  const events = [];
  let cur = null;
  let inAlarm = false;
  for (const line of unfolded.split("\r\n")) {
    if (line === "BEGIN:VEVENT") cur = { alarms: [] };
    else if (line === "END:VEVENT") {
      events.push(cur);
      cur = null;
    } else if (line === "BEGIN:VALARM") inAlarm = true;
    else if (line === "END:VALARM") inAlarm = false;
    else if (cur) {
      const idx = line.indexOf(":");
      const key = line.slice(0, idx);
      const val = line
        .slice(idx + 1)
        .replace(/\\n/g, "\n")
        .replace(/\\([,;\\])/g, "$1");
      if (inAlarm) {
        if (key === "TRIGGER") cur.alarms.push(val);
      } else cur[key] = val;
    }
  }
  return events;
}

// ---------- "Add to calendar" links (open the student's own calendar in a new tab) ----------

function eventText(a) {
  return {
    title: `${a.status === "verified" ? "" : "[UNVERIFIED] "}${a.course} ${displayName(a)}`,
    details:
      (a.status === "verified"
        ? `Marked verified by you via ${a.sourceType}: ${a.sourceRef}`
        : "UNVERIFIED — not yet checked against an official source.") +
      "\nReconfirm the date/time in D2L or with your instructor. Unofficial reminder from Assessment Guard." +
      "\nSuggested alerts: 7 days, 48 hours and 24 hours before.",
  };
}

/** Google Calendar "create event" template link. Times in UTC (Z) so Google converts correctly. */
export function googleCalendarUrl(a, durationMinutes = 60) {
  const start = new Date(a.startUtc);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const { title, details } = eventText(a);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsUtcStamp(start)}/${icsUtcStamp(end)}`,
    details,
  });
  if (a.location) p.set("location", a.location);
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Outlook on the web (Microsoft 365 work/school accounts) compose link. */
export function outlookCalendarUrl(a, durationMinutes = 60) {
  const start = new Date(a.startUtc);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const { title, details } = eventText(a);
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: start.toISOString().replace(/\.\d{3}Z$/, "Z"),
    enddt: end.toISOString().replace(/\.\d{3}Z$/, "Z"),
    body: details,
  });
  if (a.location) p.set("location", a.location);
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
}

// ---------- Grades (INFS1101 weights) ----------

/** Validate a score string. "" => null (not entered). Returns { ok, value, error }. */
export function parseScore(text) {
  const t = String(text ?? "").trim();
  if (t === "") return { ok: true, value: null };
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return { ok: false, error: "Use a number from 0 to 100." };
  const v = Number(t);
  if (v < 0 || v > 100) return { ok: false, error: "Use a number from 0 to 100." };
  return { ok: true, value: v };
}

/** scores: {final, midterm, labs, quizzes, tests} each number|null (null = not yet known).
 *  Returns earned points, remaining weight, and the average needed on remaining components. */
export function gradeAnalysis(scores, target = INFS1101_PASS, weights = INFS1101_WEIGHTS) {
  if (!Number.isFinite(target) || target < 0) throw new Error("Invalid target");
  let earned = 0;
  let knownWeight = 0;
  const remaining = [];
  for (const [key, w] of Object.entries(weights)) {
    const s = scores[key];
    if (s === null || s === undefined) remaining.push(key);
    else {
      earned += (s * w) / 100;
      knownWeight += w;
    }
  }
  const remainingWeight = 100 - knownWeight;
  let required = null;
  let feasibility;
  if (remainingWeight === 0) {
    feasibility = earned >= target ? "met" : "not-met";
  } else {
    required = ((target - earned) / remainingWeight) * 100;
    if (required <= 0) feasibility = "already-secured";
    else if (required > 100) feasibility = "impossible";
    else feasibility = "possible";
  }
  return {
    earned: round2(earned),
    knownWeight,
    remainingWeight,
    remaining,
    required: required === null ? null : round2(required),
    feasibility,
    target,
  };
}

/** Projected total if every not-yet-known component earns `assumedAverage`. */
export function projectTotal(scores, assumedAverage, weights = INFS1101_WEIGHTS) {
  const a = gradeAnalysis(scores, 0, weights);
  return round2(a.earned + (a.remainingWeight * assumedAverage) / 100);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------- Synthetic demo data (clearly labelled, never saved to real storage) ----------

export function syntheticAssessments(now = new Date()) {
  const at = (days, h) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, 0, 0, 0);
    return d;
  };
  const mk = (i, type, date, status, extra = {}) => ({
    id: `demo-${i}`,
    course: "DEMO101",
    type,
    title: "SYNTHETIC",
    startUtc: date.toISOString(),
    localInput: toLocalInputValue(date),
    timeZone: localTimeZoneName(),
    status,
    sourceType: status === "verified" ? "Other official confirmation" : "",
    sourceRef: status === "verified" ? "SYNTHETIC demo source — not a real announcement" : "",
    location: "SYNTHETIC — not a real room",
    checkedAt: now.toISOString(),
    sequence: 0,
    exportedAt: null,
    calendarConfirmedAt: null,
    calendarStale: false,
    synthetic: true,
    ...extra,
  });
  return [
    mk(1, "Quiz", at(-2, 10), "verified"),
    mk(2, "Lab", at(1, 9), "verified"),
    mk(3, "Test", at(5, 11), "unverified"),
    mk(4, "Final Exam", at(30, 8), "verified", { calendarConfirmedAt: now.toISOString() }),
  ];
}
