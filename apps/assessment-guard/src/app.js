// Assessment Guard — DOM layer. All user data is rendered with textContent (never innerHTML).
import * as C from "./core.js";

const $ = (id) => document.getElementById(id);
const PREF_KEY = "assessment_guard_prefs";

const state = {
  real: [],
  demo: null, // array when demo mode is on; never persisted
  editingId: null,
  storageOk: true,
};

const current = () => (state.demo ? state.demo : state.real);

// ---------- storage ----------
function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function load() {
  const parsed = C.parseStore(safeGet(C.STORAGE_KEY));
  state.real = parsed.ok ? parsed.assessments : [];
  if (!parsed.ok) {
    say(
      "Saved data in this browser could not be read, so it was not loaded. Nothing was deleted. Restore a backup if you have one.",
    );
  } else if (parsed.dropped) {
    say(
      `${parsed.dropped} damaged saved record(s) were skipped. Check your list against your backup.`,
    );
  }
}

function persist() {
  if (state.demo) return true; // demo data is never saved
  const ok = safeSet(C.STORAGE_KEY, C.serializeStore(state.real));
  state.storageOk = ok;
  if (!ok)
    say(
      "Warning: this browser refused to save (private mode or storage full). Your changes will be lost when you close the page. Download a backup now.",
    );
  return ok;
}

function setList(next) {
  if (state.demo) state.demo = next;
  else state.real = next;
  persist();
  render();
}

// ---------- feedback ----------
function say(text) {
  const el = $("feedback");
  el.textContent = "";
  // Re-set on next frame so screen readers announce repeated identical messages.
  requestAnimationFrame(() => {
    el.textContent = text;
  });
}

// ---------- formatting ----------
function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtShort(iso) {
  return iso
    ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "never";
}
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

// ---------- in-page confirmation (browser confirm() is blocked in some hosts) ----------
let confirmResolve = null;
function askConfirm(message, confirmLabel) {
  const box = $("confirmBox");
  const opener = document.activeElement;
  $("confirmText").textContent = message;
  $("confirmYes").textContent = confirmLabel;
  box.hidden = false;
  $("confirmNo").focus();
  return new Promise((resolve) => {
    confirmResolve = (answer) => {
      box.hidden = true;
      confirmResolve = null;
      if (opener && document.contains(opener)) opener.focus();
      resolve(answer);
    };
  });
}

// ---------- saving files ----------
// Inside a claude.ai artifact, files go through the platform's "downloads" capability
// (it shows the viewer a confirmation). Everywhere else, a normal browser download.
const hosted = typeof window.claude?.use === "function";
let downloadsPromise = null;
function hostDownloads() {
  if (!hosted) return Promise.resolve(null);
  if (!downloadsPromise) downloadsPromise = window.claude.use("downloads").catch(() => null);
  return downloadsPromise;
}

/** Returns "saved", "declined" or "unavailable". */
async function saveFile(filename, text, type) {
  if (!hosted) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return "saved";
  }
  const dl = await hostDownloads();
  if (!dl) return "unavailable";
  try {
    await dl.save({ filename, data: text });
    return "saved";
  } catch (e) {
    return e && e.code === "declined" ? "declined" : "unavailable";
  }
}

// ---------- form ----------
const FIELDS = ["course", "type", "title", "when", "sourceType", "sourceRef", "location"];

function readForm() {
  const f = $("form");
  return {
    course: f.course.value,
    type: f.type.value,
    title: f.title.value,
    when: f.when.value,
    status: f.querySelector('input[name="status"]:checked')?.value || "unverified",
    sourceType: f.sourceType.value,
    sourceRef: f.sourceRef.value,
    location: f.location.value,
  };
}

function clearErrors() {
  for (const name of FIELDS) {
    const input = $(name);
    input.removeAttribute("aria-invalid");
    const err = $(`${name}-error`);
    if (err) err.remove();
    const describedBy = (input.getAttribute("aria-describedby") || "")
      .split(" ")
      .filter((x) => x && x !== `${name}-error`);
    if (describedBy.length) input.setAttribute("aria-describedby", describedBy.join(" "));
    else input.removeAttribute("aria-describedby");
  }
  $("errorSummary").hidden = true;
  $("errorList").textContent = "";
}

function showErrors(errors) {
  clearErrors();
  const list = $("errorList");
  for (const [name, message] of Object.entries(errors)) {
    const input = $(name);
    input.setAttribute("aria-invalid", "true");
    const p = el("p", { id: `${name}-error`, class: "field-error", text: message });
    input.insertAdjacentElement("afterend", p);
    const db = input.getAttribute("aria-describedby");
    input.setAttribute("aria-describedby", db ? `${db} ${name}-error` : `${name}-error`);
    const a = el("a", { href: `#${name}`, text: message });
    a.addEventListener("click", (e) => {
      e.preventDefault();
      input.focus();
    });
    list.append(el("li", {}, a));
  }
  const summary = $("errorSummary");
  summary.hidden = false;
  summary.focus();
}

function updatePreview() {
  const value = $("when").value;
  const out = $("whenPreview");
  if (!value) {
    out.textContent = "No date entered yet.";
    return;
  }
  const p = C.parseLocalDateTime(value);
  out.textContent = p.ok
    ? `Will be saved as: ${fmtDateTime(p.date.toISOString())} — ${C.localTimeZoneName()} (${C.utcOffsetLabel(p.date)}).`
    : p.error;
}

function syncSourceRequirement() {
  const verified = $("form").querySelector('input[name="status"]:checked')?.value === "verified";
  for (const id of ["sourceType", "sourceRef"]) {
    if (verified) $(id).setAttribute("aria-required", "true");
    else $(id).removeAttribute("aria-required");
  }
}

function resetForm() {
  const f = $("form");
  const course = f.course.value;
  f.reset();
  f.course.value = course || "INFS1101";
  state.editingId = null;
  $("saveBtn").textContent = "Save assessment";
  $("cancelEdit").hidden = true;
  $("formHeading").textContent = "1. Add an assessment you have checked";
  clearErrors();
  updatePreview();
  syncSourceRequirement();
}

function onSubmit(e) {
  e.preventDefault();
  const v = C.validateAssessmentInput(readForm(), new Date());
  if (!v.ok) {
    showErrors(v.errors);
    say("Not saved. Fix the highlighted fields and try again.");
    return;
  }
  const list = current();
  const editing = state.editingId ? list.find((a) => a.id === state.editingId) : null;
  if (C.isDuplicate(list, v.value, state.editingId)) {
    showErrors({ when: "You already saved this assessment at this exact time." });
    say("Not saved: duplicate of an assessment already in your list.");
    return;
  }
  if (editing) {
    const timeChanged = editing.startUtc !== v.value.startUtc;
    const contentChanged =
      timeChanged ||
      editing.title !== v.value.title ||
      editing.type !== v.value.type ||
      editing.location !== v.value.location ||
      editing.course !== v.value.course ||
      editing.status !== v.value.status;
    const wasExported = Boolean(editing.exportedAt || editing.calendarConfirmedAt);
    const updated = {
      ...editing,
      ...v.value,
      sequence: contentChanged ? (editing.sequence || 0) + 1 : editing.sequence || 0,
      calendarStale: editing.calendarStale || (contentChanged && wasExported),
      calendarConfirmedAt: contentChanged ? null : editing.calendarConfirmedAt,
    };
    setList(list.map((a) => (a.id === editing.id ? updated : a)));
    resetForm();
    say(
      contentChanged && wasExported
        ? "Changes saved here only. Your calendar still has the OLD event — export again and update or delete the old one yourself."
        : "Changes saved in this browser.",
    );
  } else {
    const rec = {
      id: C.newId(),
      sequence: 0,
      exportedAt: null,
      calendarConfirmedAt: null,
      calendarStale: false,
      synthetic: Boolean(state.demo),
      ...v.value,
    };
    setList([...list, rec]);
    resetForm();
    say(
      `Saved in this browser${state.demo ? " (demo only — not kept)" : ""}: ${rec.course} ${C.displayName(rec)}. Nothing has been added to your calendar yet — use “Export to calendar”.`,
    );
  }
}

function startEdit(a) {
  const f = $("form");
  state.editingId = a.id;
  f.course.value = a.course;
  f.type.value = a.type;
  f.title.value = a.title;
  f.when.value = C.toLocalInputValue(new Date(a.startUtc));
  f.querySelector(`input[name="status"][value="${a.status}"]`).checked = true;
  f.sourceType.value = a.sourceType;
  f.sourceRef.value = a.sourceRef;
  f.location.value = a.location;
  $("saveBtn").textContent = "Save changes";
  $("cancelEdit").hidden = false;
  $("formHeading").textContent = `1. Editing: ${a.course} ${C.displayName(a)}`;
  clearErrors();
  updatePreview();
  syncSourceRequirement();
  $("formHeading").scrollIntoView({ block: "start" });
  f.when.focus();
}

// ---------- list ----------
const TIME_PILL = {
  overdue: ["bad", "✖"],
  within24h: ["bad", "⚠"],
  within48h: ["warn", "⚠"],
  within7d: ["warn", "●"],
  later: ["neutral", "○"],
};

function render() {
  const now = new Date();
  const list = current();
  const filter = $("filter").value;
  const shown = C.filterAssessments(list, filter, now);
  const root = $("list");
  root.textContent = "";

  const upcoming = list.filter((a) => C.timeState(a.startUtc, now) !== "overdue").length;
  const attention = list.filter((a) => C.needsAttention(a, now)).length;
  $("summary").textContent = list.length
    ? `${list.length} saved · ${upcoming} upcoming · ${attention} need attention. Checked against the clock at ${fmtShort(now.toISOString())}.`
    : "";

  if (!shown.length) {
    root.append(
      el("li", {
        class: "hint",
        text: list.length
          ? "Nothing matches this filter."
          : "No assessments saved. Nothing is pre-filled — add one you have checked in D2L or with your instructor.",
      }),
    );
    return;
  }

  for (const a of shown) {
    const t = C.timeState(a.startUtc, now);
    const flags = C.attentionFlags(a, now);
    const [tone, symbol] = TIME_PILL[t];
    const headingId = `h-${a.id}`;
    const item = el("li", {
      class: `item${t === "within24h" || t === "within48h" || t === "overdue" ? " alert" : ""}${a.synthetic ? " synthetic" : ""}`,
      "aria-labelledby": headingId,
    });
    item.append(
      el("h3", {
        id: headingId,
        text: `${a.synthetic ? "[SYNTHETIC] " : ""}${a.course} — ${C.displayName(a)}`,
      }),
      el("p", { text: fmtDateTime(a.startUtc) }),
      el(
        "p",
        {},
        el("span", { class: `pill ${tone}`, text: `${symbol} ${C.TIME_LABELS[t]}` }),
        el("span", {
          class: `pill ${a.status === "verified" ? "ok" : "bad"}`,
          text: a.status === "verified" ? "✔ Marked verified by you" : "? Unverified",
        }),
      ),
    );
    if (a.status === "verified")
      item.append(el("p", { text: `Checked in: ${a.sourceType} — “${a.sourceRef}”` }));
    if (a.location) item.append(el("p", { text: `Details: ${a.location}` }));
    item.append(
      el("p", {
        class: "hint",
        text: `Last checked: ${fmtShort(a.checkedAt)} · Exported: ${fmtShort(a.exportedAt)} · Confirmed in calendar: ${fmtShort(a.calendarConfirmedAt)}`,
      }),
    );
    if (flags.length) {
      const ul = el("ul", { class: "flags", "aria-label": "Needs attention" });
      for (const f of flags) ul.append(el("li", { text: f }));
      item.append(ul);
    }
    const label = `${a.course} ${C.displayName(a)}`;
    const actions = el("div", { class: "actions" });
    if (t !== "overdue")
      actions.append(
        el("a", {
          class: "btn small",
          href: C.googleCalendarUrl(a),
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Add to Google Calendar",
          "aria-label": `Add to Google Calendar (opens new tab): ${label}`,
          onclick: () => markLinkExport(a, "Google Calendar"),
        }),
        el("a", {
          class: "btn small",
          href: C.outlookCalendarUrl(a),
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Add to Outlook",
          "aria-label": `Add to Outlook calendar (opens new tab): ${label}`,
          onclick: () => markLinkExport(a, "Outlook"),
        }),
        el("button", {
          type: "button",
          class: "btn small",
          text: "Download .ics file",
          "aria-label": `Download .ics file: ${label}`,
          onclick: () => exportAssessments([a]),
        }),
        el("button", {
          type: "button",
          class: "btn small",
          text: "I checked it is in my calendar",
          "aria-label": `I checked it is in my calendar: ${label}`,
          onclick: () => confirmCalendar(a),
        }),
      );
    actions.append(
      el("button", {
        type: "button",
        class: "btn small",
        text: "Re-checked official source now",
        "aria-label": `Re-checked official source now: ${label}`,
        onclick: () => recheck(a),
      }),
      el("button", {
        type: "button",
        class: "btn small",
        text: "Edit",
        "aria-label": `Edit: ${label}`,
        onclick: () => startEdit(a),
      }),
      el("button", {
        type: "button",
        class: "btn small danger",
        text: "Delete",
        "aria-label": `Delete: ${label}`,
        onclick: () => remove(a),
      }),
    );
    item.append(actions);
    root.append(item);
  }
}

function update(id, patch) {
  setList(current().map((a) => (a.id === id ? { ...a, ...patch } : a)));
}

function recheck(a) {
  if (a.status !== "verified") {
    say("This one is unverified. Use Edit to add where you checked it, then save.");
    startEdit(a);
    return;
  }
  update(a.id, { checkedAt: new Date().toISOString() });
  say(
    `Recorded that you re-checked ${C.displayName(a)} just now. The date itself was not changed.`,
  );
}

function confirmCalendar(a) {
  if (!a.exportedAt) {
    say("Export this assessment first, import it into your calendar, then confirm.");
    return;
  }
  update(a.id, { calendarConfirmedAt: new Date().toISOString(), calendarStale: false });
  say(
    `Noted: you confirmed ${C.displayName(a)} is in your calendar. Check its reminders there too.`,
  );
}

async function remove(a) {
  const label = `${a.course} ${C.displayName(a)} on ${fmtDateTime(a.startUtc)}`;
  const ok = await askConfirm(
    `Delete ${label} from this tool? Any event already in your calendar will NOT be deleted.`,
    "Delete it",
  );
  if (!ok) {
    say("Nothing was deleted.");
    return;
  }
  setList(current().filter((x) => x.id !== a.id));
  if (state.editingId === a.id) resetForm();
  say(
    a.exportedAt
      ? "Deleted here only. If you imported it into your calendar, delete that event there yourself."
      : "Deleted from this tool.",
  );
}

// ---------- export / backup ----------
function markExported(ids, now = new Date()) {
  setList(current().map((a) => (ids.has(a.id) ? { ...a, exportedAt: now.toISOString() } : a)));
}

function showExportHelp() {
  const help = $("exportHelp");
  help.hidden = false;
  help.focus();
}

function markLinkExport(a, where) {
  // The link opens the calendar in a new tab; the student still has to press Save there.
  markExported(new Set([a.id]));
  say(
    `${where} opened in a new tab with this event filled in. It is NOT saved until you press Save there — then come back and press “I checked it is in my calendar”.`,
  );
  showExportHelp();
}

async function exportAssessments(arr) {
  const now = new Date();
  const future = arr.filter((a) => C.timeState(a.startUtc, now) !== "overdue");
  if (!future.length) {
    say("Nothing to export: there are no upcoming assessments.");
    return;
  }
  const ics = C.buildIcs(future, now);
  const name =
    future.length === 1
      ? `assessment-${future[0].course}-${future[0].type.replace(/\W+/g, "-")}.ics`.toLowerCase()
      : "assessments-upcoming.ics";
  if (hosted) {
    // The hosted page cannot hand out .ics files; show the text so nothing is lost.
    $("icsText").value = ics;
    $("icsFallback").hidden = false;
    say(
      "This shared page cannot download .ics files. Use “Add to Google Calendar” or “Add to Outlook” instead, or copy the calendar text shown below.",
    );
    $("icsFallback").focus();
    return;
  }
  await saveFile(name, ics, "text/calendar;charset=utf-8");
  markExported(new Set(future.map((a) => a.id)), now);
  say(
    `Downloaded ${name} with ${future.length} event(s). It is NOT in your calendar until you open it and import it — see the steps below.`,
  );
  showExportHelp();
}

async function copyIcs() {
  const box = $("icsText");
  try {
    await navigator.clipboard.writeText(box.value);
    say(
      "Calendar text copied. Paste it into a plain-text file named assessment.ics, then open that file.",
    );
  } catch {
    box.focus();
    box.select();
    say("Copy was blocked here. The text is selected — press Ctrl+C (or Cmd+C) to copy it.");
  }
}

async function backup() {
  if (state.demo) {
    say("Backups are disabled in demo mode. Leave demo mode to back up your own data.");
    return;
  }
  const stamp = new Date().toISOString().slice(0, 10);
  const result = await saveFile(
    `assessment-guard-backup-${stamp}.json`,
    C.serializeStore(state.real),
    "application/json",
  );
  say(
    {
      saved: "Backup saved. Keep it somewhere safe — it is the only copy outside this browser.",
      declined: "Backup not saved: you declined the download.",
      unavailable:
        "Backup is not available on this page. Open the offline version to back up your data.",
    }[result],
  );
}

function restore(file) {
  if (!file) return;
  if (state.demo) {
    say("Leave demo mode before restoring a backup.");
    return;
  }
  if (file.size > 1_000_000) {
    say("Not restored: that file is too large to be an Assessment Guard backup.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = C.parseStore(String(reader.result));
    if (!parsed.ok) {
      say(`Not restored: ${parsed.error} Your current list was not changed.`);
      return;
    }
    const merged = C.mergeImport(state.real, parsed.assessments);
    setList(merged.assessments);
    say(
      `Restore finished: ${merged.added} added, ${merged.skipped} already present, ${parsed.dropped} invalid record(s) skipped. Existing entries were not overwritten.`,
    );
  };
  reader.onerror = () => say("Not restored: the file could not be read.");
  reader.readAsText(file);
}

async function clearAll() {
  if (state.demo) {
    say("Leave demo mode to manage your own data.");
    return;
  }
  if (!state.real.length) {
    say("There is nothing saved to delete.");
    return;
  }
  const ok = await askConfirm(
    `Delete all ${state.real.length} saved assessment(s) from this browser? Events already in your calendar will NOT be deleted. Consider downloading a backup first.`,
    "Delete everything",
  );
  if (!ok) {
    say("Nothing was deleted.");
    return;
  }
  setList([]);
  resetForm();
  say("All saved assessments were deleted from this browser. Calendar events were not touched.");
}

// ---------- demo ----------
function toggleDemo() {
  const on = !state.demo;
  state.demo = on ? C.syntheticAssessments(new Date()) : null;
  $("demoBanner").hidden = !on;
  const btn = $("demoToggle");
  btn.setAttribute("aria-pressed", String(on));
  btn.textContent = on ? "Leave demo (back to my data)" : "Show synthetic demo";
  $("course").value = on ? "DEMO101" : "INFS1101";
  resetForm();
  render();
  say(
    on
      ? "Demo mode on: showing SYNTHETIC assessments. Nothing is saved."
      : "Demo mode off: showing your own saved list.",
  );
}

// ---------- grades ----------
function buildGradeInputs() {
  const root = $("gradeInputs");
  for (const [key, w] of Object.entries(C.INFS1101_WEIGHTS)) {
    const id = `g-${key}`;
    root.append(
      el(
        "div",
        { class: "field" },
        el("label", { for: id, text: `${C.COMPONENT_LABELS[key]} (${w}%) score` }),
        el("input", {
          id,
          inputmode: "decimal",
          autocomplete: "off",
          placeholder: "not known yet",
        }),
      ),
    );
  }
}

function calculate(e) {
  e?.preventDefault();
  const out = $("gradeResult");
  out.textContent = "";
  const scores = {};
  const problems = [];
  const entered = [];
  for (const key of Object.keys(C.INFS1101_WEIGHTS)) {
    const input = $(`g-${key}`);
    const r = C.parseScore(input.value);
    input.removeAttribute("aria-invalid");
    if (!r.ok) {
      problems.push(`${C.COMPONENT_LABELS[key]}: ${r.error}`);
      input.setAttribute("aria-invalid", "true");
    } else {
      scores[key] = r.value;
      if (r.value !== null)
        entered.push(
          `${C.COMPONENT_LABELS[key]} ${r.value}%${input.dataset.scenario ? " (scenario)" : ""}`,
        );
    }
  }
  const target = C.parseScore($("target").value || "60");
  const assumed = C.parseScore($("assumed").value);
  if (!target.ok) problems.push(`Target: ${target.error}`);
  if (!assumed.ok) problems.push(`Projection average: ${assumed.error}`);
  if (problems.length) {
    out.append(el("p", { class: "field-error", text: "Not calculated." }));
    for (const p of problems) out.append(el("p", { text: p }));
    return;
  }
  const a = C.gradeAnalysis(scores, target.value);
  out.append(
    el("p", {
      text: entered.length
        ? `You entered: ${entered.join(", ")}.`
        : "You have not entered any scores.",
    }),
    el("p", {
      text: `Points secured from entered scores: ${a.earned} of ${a.knownWeight} possible. Still to come: ${a.remainingWeight}% of the grade${a.remaining.length ? ` (${a.remaining.map((k) => C.COMPONENT_LABELS[k]).join(", ")})` : ""}.`,
    }),
  );
  const msg = {
    possible: `To reach ${a.target}% overall you need an average of ${a.required}% across the remaining ${a.remainingWeight}%.`,
    impossible: `Reaching ${a.target}% would need ${a.required}% on the remaining ${a.remainingWeight}% — not possible under these numbers. Ask your instructor what options, if any, exist under course rules.`,
    "already-secured": `Your entered scores already reach ${a.target}% even if every remaining part scores 0.`,
    met: `With every component entered, the total is ${a.earned}% — at or above ${a.target}%.`,
    "not-met": `With every component entered, the total is ${a.earned}% — below ${a.target}%.`,
  }[a.feasibility];
  out.append(el("p", { text: msg }));
  if (assumed.value !== null && a.remainingWeight > 0) {
    out.append(
      el("p", {
        text: `Projection (assumed, not real): if every remaining part averages ${assumed.value}%, the overall total would be ${C.projectTotal(scores, assumed.value)}%.`,
      }),
    );
  }
  out.append(
    el("p", {
      class: "hint",
      text: "Estimate only, using master-syllabus weights. Your section may have different rules, and this tool has no access to your real grades.",
    }),
  );
}

function midtermScenario() {
  const input = $("g-midterm");
  input.value = "0";
  input.dataset.scenario = "1";
  calculate();
  say("Scenario applied: midterm counted as 0. This is a what-if, not a recorded grade.");
}

function clearGrades() {
  for (const key of Object.keys(C.INFS1101_WEIGHTS)) {
    const i = $(`g-${key}`);
    i.value = "";
    delete i.dataset.scenario;
    i.removeAttribute("aria-invalid");
  }
  $("assumed").value = "";
  $("target").value = "60";
  $("gradeResult").textContent = "";
}

// ---------- prefs ----------
function applyTextSize(v) {
  const size = ["100", "150", "200"].includes(v) ? v : "100";
  document.documentElement.style.fontSize = `${size}%`;
  $("textSize").value = size;
  safeSet(PREF_KEY, JSON.stringify({ textSize: size }));
}

// ---------- init ----------
function init() {
  const typeSel = $("type");
  for (const t of C.ASSESSMENT_TYPES) typeSel.append(el("option", { value: t, text: t }));
  const srcSel = $("sourceType");
  srcSel.append(el("option", { value: "", text: "Choose a source" }));
  for (const s of C.SOURCE_TYPES) srcSel.append(el("option", { value: s, text: s }));
  buildGradeInputs();

  let prefs = {};
  try {
    prefs = JSON.parse(safeGet(PREF_KEY) || "{}") || {};
  } catch {
    prefs = {};
  }
  applyTextSize(prefs.textSize);

  load();
  $("form").addEventListener("submit", onSubmit);
  $("when").addEventListener("input", updatePreview);
  $("form").addEventListener("change", (e) => {
    if (e.target.name === "status") syncSourceRequirement();
  });
  $("cancelEdit").addEventListener("click", () => {
    resetForm();
    say("Edit cancelled. Nothing was changed.");
  });
  $("filter").addEventListener("change", render);
  $("exportAll").addEventListener("click", () => exportAssessments(current()));
  $("backup").addEventListener("click", backup);
  $("restore").addEventListener("change", (e) => {
    restore(e.target.files[0]);
    e.target.value = "";
  });
  $("clearAll").addEventListener("click", clearAll);
  $("confirmYes").addEventListener("click", () => confirmResolve?.(true));
  $("confirmNo").addEventListener("click", () => confirmResolve?.(false));
  $("confirmBox").addEventListener("keydown", (e) => {
    if (e.key === "Escape") confirmResolve?.(false);
  });
  $("copyIcs").addEventListener("click", copyIcs);
  if (hosted) $("exportAll").textContent = "Show calendar text for all upcoming";
  $("demoToggle").addEventListener("click", toggleDemo);
  $("textSize").addEventListener("change", (e) => applyTextSize(e.target.value));
  $("gradeForm").addEventListener("submit", calculate);
  $("midtermZero").addEventListener("click", midtermScenario);
  $("gradeClear").addEventListener("click", clearGrades);
  $("g-midterm").addEventListener("input", (e) => delete e.target.dataset.scenario);

  syncSourceRequirement();
  updatePreview();
  render();
  // Re-evaluate risk states every minute while the page is open.
  // Skip while focus is inside the list so keyboard users never lose their place.
  setInterval(() => {
    if (!$("list").contains(document.activeElement)) render();
  }, 60_000);
}

init();
