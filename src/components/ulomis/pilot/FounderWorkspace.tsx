import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileJson,
  FileText,
  FolderInput,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { UButton } from "../Button";
import { UCard } from "../Card";
import { UlomisMark } from "../UlomisMark";
import { useTheme } from "../theme";
import { claimLabels, pt } from "./pilot-copy";
import {
  base64ToArrayBuffer,
  clearFounderDraft,
  deletePilotAttachments,
  downloadJson,
  getAttachment,
  loadFounderDraft,
  parseIntakePacket,
  replacePilotAttachments,
  saveFounderDraft,
  sha256,
} from "./pilot-storage";
import {
  PILOT_SCHEMA_VERSION,
  claimFieldOrder,
  type ClaimClassification,
  type ClaimField,
  type ContinuityClaim,
  type PilotIntakePacket,
  type PilotSource,
  type PreparedContinuityPacket,
} from "./pilot-types";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const MAX_INTAKE_PACKET_BYTES = 20 * 1024 * 1024;

const classificationLabels: Record<ClaimClassification, string> = {
  source_fact: "Source-backed fact",
  user_statement: "Participant-stated meaning",
  inference: "Inference — requires confirmation",
  suggestion: "Suggestion — participant decides",
  contradiction: "Contradiction — unresolved alternatives",
};

const fieldGuidance: Record<ClaimField, string> = {
  objective: "What outcome is this live workflow trying to produce?",
  currentState: "What is true now, after accounting for the latest evidence?",
  latestMeaningfulChange: "What changed the operational state most recently?",
  decision: "What decision currently governs the work?",
  rationale: "Why was that decision made? Preserve the operational reason, not just the event.",
  commitments: "Who has committed to what, and by when? Use one line per material commitment.",
  dependencies: "What must happen, arrive, or be approved before progress can continue?",
  unresolvedItems: "What remains open and could block or redirect the work?",
  missingInformation: "What needed information is absent? Do not invent it.",
  owners: "Who currently owns each material action or decision?",
  contradictions: "Which sources disagree or cannot both represent current state? Write 'No material contradiction identified' only when evidence supports that conclusion.",
  nextAction: "One restrained action that advances the thread from the verified state. This is a suggestion, not an instruction.",
};

type StoredIntake = Omit<PilotIntakePacket, "attachments"> & {
  attachmentIds: string[];
};

type WorkspaceDraft = {
  kind: "ulomis_founder_workspace";
  version: 1;
  intake: StoredIntake;
  preparedBy: string;
  operatorMessage: string;
  claims: ContinuityClaim[];
  updatedAt: string;
};

function defaultClassification(field: ClaimField): ClaimClassification {
  if (field === "nextAction") return "suggestion";
  if (field === "missingInformation") return "inference";
  if (field === "contradictions") return "contradiction";
  return "source_fact";
}

function createClaim(field: ClaimField): ContinuityClaim {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `claim-${field}-${Date.now()}`,
    field,
    value: "",
    classification: defaultClassification(field),
    confidence: field === "nextAction" || field === "missingInformation" ? 0.65 : 0.8,
    sourceIds: [],
    lastConfirmed: new Date().toISOString().slice(0, 10),
    consequential: true,
  };
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function verifyWorkspaceEvidence(intake: StoredIntake) {
  const attachmentIds = new Set(intake.attachmentIds);
  for (const source of intake.sources) {
    if (source.attachmentId) {
      if (!attachmentIds.has(source.attachmentId)) throw new Error(`Attachment manifest is missing ${source.label}.`);
      const record = await getAttachment(source.attachmentId);
      if (!record || record.pilotId !== intake.pilotId) throw new Error(`The local attachment for ${source.label} is missing or belongs to another pilot.`);
      const digest = await sha256(record.data);
      if (digest !== source.sha256 || digest !== record.sha256) throw new Error(`Attachment integrity check failed for ${source.label}.`);
    } else {
      const material = source.kind === "link" ? source.link : source.text;
      const digest = await sha256(material);
      if (digest !== source.sha256) throw new Error(`Source integrity check failed for ${source.label}.`);
    }
  }
}

function validateDraft(draft: WorkspaceDraft) {
  const sourceIds = new Set(draft.intake.sources.map((source) => source.id));
  const errors: string[] = [];
  if (!draft.preparedBy.trim()) errors.push("Prepared by is required.");
  if (!draft.operatorMessage.trim()) errors.push("The participant review message is required.");
  for (const field of claimFieldOrder) {
    const claim = draft.claims.find((item) => item.field === field);
    if (!claim) {
      errors.push(`${field}: claim missing.`);
      continue;
    }
    if (!claim.value.trim()) errors.push(`${field}: content is required.`);
    if (!claim.sourceIds.length) errors.push(`${field}: select at least one source.`);
    const invalidSources = claim.sourceIds.filter((id) => !sourceIds.has(id));
    if (invalidSources.length) errors.push(`${field}: references unknown sources.`);
    if (claim.confidence < 0 || claim.confidence > 1) errors.push(`${field}: confidence must be 0–100%.`);
    if (!claim.lastConfirmed) errors.push(`${field}: last-confirmed date is required.`);
  }
  return errors;
}

export function FounderWorkspace() {
  const { theme, toggleTheme } = useTheme();
  const [draft, setDraft] = useState<WorkspaceDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [integrityVerified, setIntegrityVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = loadFounderDraft<WorkspaceDraft>();
    if (stored?.kind !== "ulomis_founder_workspace" || stored.version !== 1) return;
    setDraft(stored);
    void verifyWorkspaceEvidence(stored.intake)
      .then(() => setIntegrityVerified(true))
      .catch((caught) => {
        setIntegrityVerified(false);
        setError(caught instanceof Error ? caught.message : "Stored evidence could not be re-verified.");
      });
  }, []);

  useEffect(() => {
    if (!draft) return;
    const result = saveFounderDraft({ ...draft, updatedAt: new Date().toISOString() });
    if (!result.ok) setError(`Workspace draft could not be persisted: ${result.reason}`);
  }, [draft]);

  async function importPacket(file: File) {
    if (file.size > MAX_INTAKE_PACKET_BYTES) {
      setError("The intake packet exceeds the 20 MB workspace limit.");
      return;
    }
    setBusy(true);
    setError("");
    setIntegrityVerified(false);
    try {
      const packet = parseIntakePacket(JSON.parse(await file.text()));
      const attachmentIds = new Set(packet.attachments.map((attachment) => attachment.id));
      for (const source of packet.sources) {
        if (source.attachmentId) {
          if (!attachmentIds.has(source.attachmentId)) throw new Error(`Attachment manifest is missing ${source.label}.`);
        } else {
          const material = source.kind === "link" ? source.link : source.text;
          const digest = await sha256(material);
          if (digest !== source.sha256) throw new Error(`Source integrity check failed for ${source.label}.`);
        }
      }
      const verifiedAttachments = [];
      for (const attachment of packet.attachments) {
        if (attachment.pilotId !== packet.pilotId) throw new Error(`Attachment ${attachment.name} belongs to a different pilot.`);
        const source = packet.sources.find((item) => item.attachmentId === attachment.id);
        if (!source) throw new Error(`Attachment ${attachment.name} is not referenced by the source manifest.`);
        const data = base64ToArrayBuffer(attachment.base64);
        const digest = await sha256(data);
        if (digest !== attachment.sha256 || digest !== source.sha256) throw new Error(`Attachment integrity check failed for ${attachment.name}.`);
        verifiedAttachments.push({
          id: attachment.id,
          pilotId: attachment.pilotId,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          sha256: attachment.sha256,
          addedAt: attachment.addedAt,
          data,
        });
      }
      const previousPilotId = draft?.intake.pilotId;
      await replacePilotAttachments(packet.pilotId, verifiedAttachments);
      const intake: StoredIntake = {
        kind: packet.kind,
        version: packet.version,
        exportedAt: packet.exportedAt,
        pilotId: packet.pilotId,
        participantName: packet.participantName,
        organization: packet.organization,
        qualification: packet.qualification,
        baseline: packet.baseline,
        consent: packet.consent,
        sources: packet.sources,
        attachmentIds: packet.attachments.map((attachment) => attachment.id),
        boundary: packet.boundary,
      };
      const next: WorkspaceDraft = {
        kind: "ulomis_founder_workspace",
        version: 1,
        intake,
        preparedBy: "Salima",
        operatorMessage: "I reconstructed the operational state from the material you supplied. Correct only anything that would change the work or next action.",
        claims: claimFieldOrder.map(createClaim),
        updatedAt: new Date().toISOString(),
      };
      await verifyWorkspaceEvidence(next.intake);
      if (previousPilotId && previousPilotId !== packet.pilotId) {
        await deletePilotAttachments(previousPilotId).catch(() => undefined);
      }
      setDraft(next);
      setIntegrityVerified(true);
      trackEvent("pilot_workspace_intake_imported", { pilotId: packet.pilotId, pilotStage: "processing", sourceCount: packet.sources.length, attachmentCount: packet.attachments.length });
      toast.success("Intake packet imported and attachment hashes verified.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not import this intake packet.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateClaim(field: ClaimField, update: Partial<ContinuityClaim>) {
    setDraft((current) => current ? { ...current, claims: current.claims.map((claim) => claim.field === field ? { ...claim, ...update } : claim) } : current);
  }

  async function downloadSourceAttachment(source: PilotSource) {
    if (!source.attachmentId) return;
    try {
      const record = await getAttachment(source.attachmentId);
      if (!record) throw new Error("The attachment is no longer available in local workspace storage.");
      const blob = new Blob([record.data], { type: record.type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = record.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not open the attachment.");
    }
  }

  function exportContinuity() {
    if (!draft) return;
    if (!integrityVerified) {
      setError("Evidence integrity is not verified. Re-import the intake packet before exporting continuity.");
      return;
    }
    const errors = validateDraft(draft);
    if (errors.length) {
      setError(`Prepared continuity is not valid:\n• ${errors.join("\n• ")}`);
      document.getElementById("workspace-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const exportedAt = new Date().toISOString();
    const packet: PreparedContinuityPacket = {
      kind: "ulomis_prepared_continuity",
      version: PILOT_SCHEMA_VERSION,
      exportedAt,
      pilotId: draft.intake.pilotId,
      participantName: draft.intake.participantName,
      organization: draft.intake.organization,
      continuity: {
        preparedAt: exportedAt,
        preparedBy: draft.preparedBy.trim(),
        operatorMessage: draft.operatorMessage.trim(),
        claims: draft.claims,
      },
      sourceManifest: draft.intake.sources.map(({ id, label, kind, sha256 }) => ({ id, label, kind, sha256 })),
      boundary: {
        founderAssisted: true,
        confirmedByParticipant: false,
        liveIntegrationsUsed: false,
      },
    };
    downloadJson(`ulomis-continuity-${draft.intake.pilotId.slice(0, 8)}.json`, packet);
    trackEvent("pilot_workspace_continuity_exported", { pilotId: draft.intake.pilotId, pilotStage: "processing", claimCount: draft.claims.length });
    toast.success("Prepared continuity file exported.");
  }

  async function resetWorkspace() {
    if (!window.confirm("Delete the imported pilot material and founder draft from this browser?")) return;
    setBusy(true);
    setError("");
    try {
      if (draft) await deletePilotAttachments(draft.intake.pilotId);
      const draftResult = clearFounderDraft();
      if (!draftResult.ok) throw new Error(`Workspace draft could not be deleted: ${draftResult.reason}`);
      setDraft(null);
      setIntegrityVerified(false);
      toast.success("Founder workspace data deleted from this browser.");
    } catch (caught) {
      setError(caught instanceof Error ? `Deletion could not be verified. ${caught.message}` : "Deletion could not be verified. Some local workspace data may remain.");
    } finally {
      setBusy(false);
    }
  }

  const validationErrors = useMemo(() => draft ? validateDraft(draft) : [], [draft]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2.5"><UlomisMark size={30} state="connecting" language="en" /><div><p className="font-display text-base font-semibold">Ulomis</p><p className="text-[0.68rem] text-muted-foreground">Pilot operator workspace</p></div></a>
          <span className="ms-2 inline-flex items-center gap-1.5 rounded-full border border-openloop/40 bg-openloop/10 px-3 py-1 text-xs font-bold text-openloop-foreground"><LockKeyhole className="size-3.5" /> Local founder workspace</span>
          <div className="ms-auto flex gap-2"><UButton variant="ghost" size="sm" onClick={toggleTheme}>{theme === "dark" ? "Light" : "Dark"}</UButton>{draft ? <UButton variant="ghost" size="sm" onClick={resetWorkspace}><RotateCcw /> Reset</UButton> : null}</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Founder-assisted reconstruction</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Prepare a source-backed operational state</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">Import the participant’s local packet, inspect only the material needed, write the current operational state, attach evidence to every claim, and export a file that remains explicitly unconfirmed until the participant reviews it.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <WorkspacePrinciple icon={<ShieldCheck />} title="Do not overclaim" body="This workspace does not run an LLM or access live systems. The continuity file is founder-prepared." />
          <WorkspacePrinciple icon={<FileCheck2 />} title="Every claim needs evidence" body="A claim without a source cannot be exported. Inferences and suggestions remain visibly typed." />
          <WorkspacePrinciple icon={<AlertTriangle />} title="Do not resolve uncertainty silently" body="Missing information and contradictions are explicit fields, not hidden cleanup." />
        </div>

        {error ? <div id="workspace-error" className="mt-6 whitespace-pre-line rounded-2xl border border-correction/45 bg-correction/10 p-4 text-sm leading-6 text-correction-foreground"><strong>Action needed</strong>\n{error}</div> : null}

        {!draft ? (
          <div className="mt-8 max-w-2xl rounded-3xl border border-dashed border-border bg-surface p-8 text-center">
            <FileJson className="mx-auto size-10 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Import David’s intake packet</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">The JSON file contains the baseline, source manifest, pasted excerpts, and any attachments David deliberately exported. It is not fetched from a server.</p>
            <UButton className="mt-5" size="lg" onClick={() => inputRef.current?.click()}><FolderInput /> Import intake JSON</UButton>
            <input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) importPacket(file); }} />
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <UCard padding="lg">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Live thread</p><h2 className="mt-2 text-xl font-semibold">{draft.intake.qualification.threadLabel}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{draft.intake.qualification.summary}</p></div>{integrityVerified ? <span className="inline-flex items-center gap-1.5 rounded-full bg-confirmed/12 px-3 py-1 text-xs font-bold text-confirmed-foreground"><CheckCircle2 className="size-3.5" /> Packet integrity verified</span> : null}</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><BaselineValue label="Normal re-entry" value={`${draft.intake.baseline.normalReentryMinutes} min`} /><BaselineValue label="Normal admin" value={`${draft.intake.baseline.normalAdminMinutes} min`} /><BaselineValue label="Sources reopened" value={String(draft.intake.baseline.sourcesNormallyOpened)} /><BaselineValue label="People contacted" value={String(draft.intake.baseline.peopleNormallyContacted)} /></div>
              </UCard>
              <UCard padding="lg"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Pilot boundary</p><ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li>• Participant role: direct adopter</li><li>• Expected return: {draft.intake.qualification.expectedReturnDate}</li><li>• Live integrations: none</li><li>• Confirmation state: draft only</li><li>• Participant effort after intake: material corrections only</li></ul></UCard>
            </section>

            <section>
              <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Evidence</p><h2 className="mt-2 text-2xl font-semibold">Inspect the fragments without rewriting their history</h2></div><span className="text-xs text-muted-foreground">{draft.intake.sources.length} sources</span></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {draft.intake.sources.map((source) => (
                  <UCard key={source.id} padding="md">
                    <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><FileText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{source.label}</p><p className="mt-1 text-xs text-muted-foreground">{source.kind} · {source.sourceDate || "time not supplied"} · {source.status.replace("_", " ")}</p>{source.text ? <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm leading-6 text-muted-foreground">{source.text}</p> : null}{source.link ? <a href={source.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-primary underline">Open reference</a> : null}{source.attachmentId ? <UButton className="mt-3" variant="outline" size="sm" onClick={() => downloadSourceAttachment(source)}><Download /> Open {source.fileName} · {formatBytes(source.fileSize ?? 0)}</UButton> : null}<p className="mt-3 font-mono text-[0.65rem] text-muted-foreground">{source.id.slice(0, 8)} · {source.sha256.slice(0, 12)}…</p></div></div>
                  </UCard>
                ))}
              </div>
            </section>

            <section>
              <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Operational state</p><h2 className="mt-2 text-2xl font-semibold">Write only what the evidence can support</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Every field is required because each one contributes to resumption. Use concise operator language. Do not turn the output into a narrative summary.</p></div>
              <div className="mt-6 space-y-5">
                {claimFieldOrder.map((field) => {
                  const claim = draft.claims.find((item) => item.field === field)!;
                  return <ClaimEditor key={field} field={field} claim={claim} sources={draft.intake.sources} onChange={(update) => updateClaim(field, update)} />;
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="text-sm font-semibold">Prepared by</span><input value={draft.preparedBy} onChange={(event) => setDraft({ ...draft, preparedBy: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" /></label><label className="block sm:col-span-2"><span className="text-sm font-semibold">Message shown before review</span><textarea rows={3} value={draft.operatorMessage} onChange={(event) => setDraft({ ...draft, operatorMessage: event.target.value })} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /></label></div>
              <div className="mt-6 flex flex-wrap items-center gap-3"><UButton size="lg" onClick={exportContinuity} disabled={validationErrors.length > 0 || !integrityVerified}><Download /> Export prepared continuity</UButton><span className={cn("text-sm", validationErrors.length ? "text-openloop-foreground" : "text-confirmed-foreground")}>{validationErrors.length ? `${validationErrors.length} validation issue${validationErrors.length === 1 ? "" : "s"} remain` : "All required claims have content, evidence, confidence, and time."}</span></div>
            </section>
          </div>
        )}
      </main>

      {busy ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/75 backdrop-blur-sm"><div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-lift)]"><Loader2 className="mx-auto size-8 animate-spin text-primary" /><p className="mt-3 text-sm font-semibold">Verifying and storing locally…</p></div></div> : null}
    </div>
  );
}

function WorkspacePrinciple({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <UCard padding="md"><span className="text-primary">{icon}</span><h2 className="mt-3 text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></UCard>;
}

function BaselineValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-muted/45 p-3"><p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}

function ClaimEditor({ field, claim, sources, onChange }: { field: ClaimField; claim: ContinuityClaim; sources: PilotSource[]; onChange: (update: Partial<ContinuityClaim>) => void }) {
  const selectAll = () => onChange({ sourceIds: sources.filter((source) => source.status !== "excluded").map((source) => source.id) });
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{pt(claimLabels[field], "en")}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{fieldGuidance[field]}</p><textarea rows={field === "currentState" || field === "commitments" || field === "unresolvedItems" ? 5 : 3} value={claim.value} onChange={(event) => onChange({ value: event.target.value })} className="mt-4 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Write concise operational state. Use one line per item when useful." /></div>
        <div className="space-y-4 rounded-2xl border border-border bg-muted/25 p-4">
          <label className="block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Claim type</span><select value={claim.classification} onChange={(event) => onChange({ classification: event.target.value as ClaimClassification })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring">{(Object.keys(classificationLabels) as ClaimClassification[]).map((item) => <option key={item} value={item}>{classificationLabels[item]}</option>)}</select></label>
          <label className="block"><span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><span>Confidence</span><span>{Math.round(claim.confidence * 100)}%</span></span><input type="range" min={0} max={100} value={Math.round(claim.confidence * 100)} onChange={(event) => onChange({ confidence: Number(event.target.value) / 100 })} className="mt-3 w-full accent-primary" /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Last confirmed</span><input type="date" value={claim.lastConfirmed} onChange={(event) => onChange({ lastConfirmed: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
          <fieldset><div className="flex items-center justify-between gap-2"><legend className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Supporting sources</legend><button type="button" onClick={selectAll} className="text-[0.68rem] font-bold text-primary underline">Select all included</button></div><div className="mt-3 max-h-52 space-y-2 overflow-y-auto pe-1">{sources.filter((source) => source.status !== "excluded").map((source) => <label key={source.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-border bg-background p-2.5"><input type="checkbox" checked={claim.sourceIds.includes(source.id)} onChange={(event) => onChange({ sourceIds: event.target.checked ? [...claim.sourceIds, source.id] : claim.sourceIds.filter((id) => id !== source.id) })} className="mt-0.5 size-4 rounded border-input text-primary" /><span className="min-w-0 text-xs"><span className="block truncate font-semibold">{source.label}</span><span className="text-muted-foreground">{source.id.slice(0, 8)}</span></span></label>)}</div></fieldset>
        </div>
      </div>
    </article>
  );
}
