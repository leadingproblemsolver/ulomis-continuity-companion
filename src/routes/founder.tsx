/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, FileCheck2, Lightbulb, RotateCcw, ShieldAlert } from "lucide-react";
import {
  reconstructFounder, correctFounder, acceptFounder, reportFounderReceipt,
  type FounderRecord, type FounderMode,
} from "@/lib/founder-continuity";

export const Route = createFileRoute("/founder")({
  head: () => ({
    meta: [
      { title: "Founder Continuity — Ulomis" },
      { name: "description", content: "Return to a founder thread, separate evidence from assumptions and choose a defensible next action." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: FounderContinuity,
});

const KEY = "ulomis-founder-continuity-v1";
const initial = {
  objective: "Validate one real supplier-invoice pilot",
  customerNote: "Founder-reported call note: A purchasing manager said reconciliation is slow and requested a short demo.",
  developmentNote: "Founder-reported build note: Prototype compares simulated PO, delivery and invoice records. No live customer data tested.",
  assumption: "This prospect is ready to pay a monthly subscription.",
};
const buyerOptions = ["University clubs", "Small agencies", "Small retailers"];
const frictionOptions = ["Important handoffs are lost", "Sales follow-ups get missed", "Records disagree across tools"];
const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition";
const primary = buttonStyle + " bg-primary text-primary-foreground hover:opacity-90";
const secondary = buttonStyle + " border border-border bg-surface text-foreground hover:bg-accent";
const field = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary";
const panel = "rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7";

function FounderContinuity() {
  const [mode, setMode] = useState<FounderMode>("continue");
  const [objective, setObjective] = useState(initial.objective);
  const [customerNote, setCustomerNote] = useState(initial.customerNote);
  const [developmentNote, setDevelopmentNote] = useState(initial.developmentNote);
  const [assumption, setAssumption] = useState(initial.assumption);
  const [buyer, setBuyer] = useState(buyerOptions[0]);
  const [friction, setFriction] = useState(frictionOptions[0]);
  const [access, setAccess] = useState<"none" | "one">("none");
  const [record, setRecord] = useState<FounderRecord | null>(null);
  const [correction, setCorrection] = useState("");
  const [receiptReference, setReceiptReference] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { record?: FounderRecord; mode?: FounderMode };
        if (parsed.record?.schema === "ulomis-founder-continuity/v1" && (parsed.mode === "continue" || parsed.mode === "discover")) {
          setMode(parsed.mode);
          setRecord(parsed.record);
          const sourceA = parsed.record.sources[0]?.text || "";
          const sourceB = parsed.record.sources[1]?.text || "";
          setObjective(parsed.record.objective);
          setAssumption(parsed.record.assumption);
          if (parsed.mode === "continue") {
            setCustomerNote(sourceA); setDevelopmentNote(sourceB);
          } else {
            setBuyer(sourceA); setFriction(sourceB);
          }
        }
      }
    } catch { setSaved(false); }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (record) window.localStorage.setItem(KEY, JSON.stringify({ mode, record }));
      else window.localStorage.removeItem(KEY);
      setSaved(true);
    } catch { setSaved(false); }
  }, [mode, record, hydrated]);

  function invalidate() {
    setRecord(null);
    setReceiptReference("");
    setError("");
  }
  function switchMode(next: FounderMode) {
    setMode(next); invalidate();
    setObjective(next === "continue" ? initial.objective : "Find one verifiable startup problem");
  }
  function run() {
    try {
      setRecord(reconstructFounder({mode, objective, customerNote, developmentNote, assumption, buyer, friction, access}));
      setCorrection(""); setReceiptReference(""); setError("");
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Could not reconstruct this thread.");
    }
  }
  function applyCorrection() {
    if (!record) return;
    try { setRecord(correctFounder(record, correction)); setCorrection(""); setReceiptReference(""); setError(""); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Correction failed."); }
  }
  function accept() { if (record) { setRecord(acceptFounder(record)); setError(""); } }
  function reportReceipt() {
    if (!record) return;
    try { setRecord(reportFounderReceipt(record, receiptReference)); setError(""); }
    catch (exception) { setError(exception instanceof Error ? exception.message : "Receipt not recorded."); }
  }
  function reset() {
    setRecord(null); setReceiptReference(""); setCorrection(""); setError("");
    try { window.localStorage.removeItem(KEY); } catch { setSaved(false); }
  }
  function exportJson() {
    if (!record) return;
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "ulomis-founder-continuity.json"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden /> Ulomis
          </Link>
          <span className="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground">Founder continuity · Browser-local prototype</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <div className="mb-7 max-w-3xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-widest text-primary">Recover the thread. Move reality.</div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">Your startup, continued.</h1>
          <p className="text-base leading-relaxed text-muted-foreground">Stop rebuilding context across notes, AI chats and code. Restore one founder thread, correct unsupported assumptions, and decide the next action. Nothing is sent or executed automatically.</p>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          <button type="button" className={mode === "continue" ? primary : secondary} onClick={() => switchMode("continue")} aria-pressed={mode === "continue"}>Continue my startup</button>
          <button type="button" className={mode === "discover" ? primary : secondary} onClick={() => switchMode("discover")} aria-pressed={mode === "discover"}><Lightbulb className="size-4" aria-hidden /> Find a testable opportunity</button>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className={panel} aria-labelledby="founder-inputs">
            <h2 id="founder-inputs" className="text-xl font-semibold">1. Input · What you know</h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">Use permitted, redacted notes. Source text is treated as founder-reported, not verified fact.</p>
            <div className="space-y-4">
              <label className="block space-y-1.5"><span className="text-sm font-medium">Objective</span>
                <input className={field} value={objective} onChange={e => { setObjective(e.target.value); invalidate(); }} maxLength={4000} />
              </label>
              {mode === "continue" ? (
                <>
                  <label className="block space-y-1.5"><span className="text-sm font-medium">S1 · Customer conversation (your report)</span>
                    <textarea className={field} rows={4} value={customerNote} onChange={e => { setCustomerNote(e.target.value); invalidate(); }} maxLength={4000} />
                  </label>
                  <label className="block space-y-1.5"><span className="text-sm font-medium">S2 · Development or execution note (your report)</span>
                    <textarea className={field} rows={4} value={developmentNote} onChange={e => { setDevelopmentNote(e.target.value); invalidate(); }} maxLength={4000} />
                  </label>
                  <label className="block space-y-1.5"><span className="text-sm font-medium">Assumption to verify</span>
                    <input className={field} value={assumption} onChange={e => { setAssumption(e.target.value); invalidate(); }} maxLength={4000} />
                  </label>
                </>
              ) : (
                <>
                  <label className="block space-y-1.5"><span className="text-sm font-medium">Possible buyer</span>
                    <select className={field} value={buyer} onChange={e => { setBuyer(e.target.value); invalidate(); }}>{buyerOptions.map(v => <option key={v}>{v}</option>)}</select>
                  </label>
                  <label className="block space-y-1.5"><span className="text-sm font-medium">Possible friction</span>
                    <select className={field} value={friction} onChange={e => { setFriction(e.target.value); invalidate(); }}>{frictionOptions.map(v => <option key={v}>{v}</option>)}</select>
                  </label>
                  <fieldset className="space-y-2"><legend className="text-sm font-medium">Existing access</legend>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="founderAccess" checked={access === "none"} onChange={() => { setAccess("none"); invalidate(); }} /> No interview contact yet</label>
                    <label className="flex items-center gap-2 text-sm"><input type="radio" name="founderAccess" checked={access === "one"} onChange={() => { setAccess("one"); invalidate(); }} /> I can speak to one operator</label>
                  </fieldset>
                </>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={primary} onClick={run}>{mode === "continue" ? "Reconstruct state" : "Generate a hypothesis"} <ArrowRight className="size-4" aria-hidden /></button>
                <button type="button" className={secondary} onClick={reset}><RotateCcw className="size-4" aria-hidden /> Clear saved thread</button>
              </div>
            </div>
            {!saved && <p role="status" className="mt-3 text-sm text-correction-foreground">Browser storage was unavailable. Export any accepted record before leaving.</p>}
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">No external AI API, email, CRM, or file access. Current inputs and generated state stay on this browser profile unless you deliberately export them. Avoid secrets and sensitive client or student records.</p>
          </section>

          <section className={panel} aria-labelledby="founder-output">
            <h2 id="founder-output" className="text-xl font-semibold">2. Process → 3. Output → 4. Result</h2>
            {!record ? (
              <div className="mt-5 space-y-4 rounded-2xl bg-secondary p-6">
                <p className="text-sm font-medium">Waiting for input.</p>
                <p className="text-sm text-muted-foreground">We will map your reported sources to a bounded current state, make unsupported assumptions visible, and recommend one falsifiable next step.</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["Inputs", "Source classification", "Current state", "Human correction", "Receipt"].map(s => <span key={s} className="rounded-full border border-border bg-surface px-2.5 py-1.5">{s}</span>)}
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4" aria-live="polite">
                <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Process · deterministic source mapping</p>
                  <p className="mt-2 text-sm">Two founder-supplied fragments are preserved and identified. The model does not independently infer that the fragments are true.</p>
                  {record.sources.map(s => <div key={s.id} className="mt-3 rounded-xl bg-surface p-3">
                    <p className="text-xs font-semibold text-primary">{s.id} · {s.kind.replaceAll("_", " ")} · unverified</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{s.text}</p>
                  </div>)}
                </div>
                <div className="rounded-2xl border border-border p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Current state</p>
                  <p className="mt-2 text-sm">{record.observation}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">Unverified assumption</p>
                  <p className="mt-1 text-sm">{record.assumption}</p>
                  <p className="mt-3 text-xs font-semibold text-muted-foreground">Unknowns</p>
                  <p className="mt-1 text-sm">{record.uncertainty}</p>
                </div>
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">One proposed next action</p>
                  <p className="mt-2 text-sm font-semibold">{record.proposedNextAction}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Why: {record.justification}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Required evidence: {record.requiredReceipt}</p>
                  <p className="mt-2 text-xs font-semibold">{record.decision === "suggested" ? "SUGGESTED · NOT EXECUTED" : "ACCEPTED · NOT EXECUTED"}</p>
                </div>
                <div className="rounded-2xl border border-border p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Human correction and authority</h3>
                  {record.correction && <p className="text-xs text-muted-foreground">Correction recorded at {record.correction.at}. Previous assumption preserved in export. Approval reset.</p>}
                  <label className="block space-y-1"><span className="text-xs text-muted-foreground">Replace inaccurate assumption (this resets acceptance)</span>
                    <input className={field} value={correction} onChange={e => setCorrection(e.target.value)} placeholder="e.g., Willingness to pay is unknown" maxLength={4000} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={secondary} disabled={!correction.trim()} onClick={applyCorrection}><ShieldAlert className="size-4" aria-hidden /> Apply correction</button>
                    <button type="button" className={primary} disabled={record.decision === "accepted_not_executed"} onClick={accept}><Check className="size-4" aria-hidden /> Accept next action</button>
                  </div>
                </div>
                {record.decision === "accepted_not_executed" && (
                  <div className="rounded-2xl border border-border p-4 space-y-3">
                    <h3 className="text-sm font-semibold">4. Result · External receipt</h3>
                    <p className="text-xs text-muted-foreground">Acceptance is NOT execution. Enter a non-sensitive receipt reference only after actually taking an action. This app cannot verify that it happened.</p>
                    <label className="block space-y-1"><span className="text-xs text-muted-foreground">External receipt reference</span>
                      <input className={field} value={receiptReference} onChange={e => setReceiptReference(e.target.value)} placeholder="e.g. message ID or reply URL (avoid secrets)" maxLength={4000} />
                    </label>
                    <button type="button" className={secondary} disabled={!receiptReference.trim()} onClick={reportReceipt}><FileCheck2 className="size-4" aria-hidden /> Record reported receipt</button>
                    {record.receipt && <p className="text-sm font-medium text-foreground">Receipt reported, not independently verified. Reference: {record.receipt.reference}</p>}
                  </div>
                )}
                <button type="button" className={secondary} onClick={exportJson}><Download className="size-4" aria-hidden /> Export complete evidence record (JSON)</button>
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-lg bg-correction/15 p-3 text-sm">{error}</p>}
          </section>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Bounded technical demo. Generated opportunities are hypotheses, not validated startup ideas. Reported receipts do not prove independent execution, paying customers, or measured time savings.</p>
      </main>
    </div>
  );
}
