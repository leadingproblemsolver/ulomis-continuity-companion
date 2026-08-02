import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Download,
  FileArchive,
  FileText,
  FolderInput,
  HelpCircle,
  Link2,
  Loader2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Minus,
  PauseCircle,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Timer,
  Trash2,
  Upload,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Language } from "../journey-data";
import { UButton } from "../Button";
import { UCard } from "../Card";
import { UlomisMark } from "../UlomisMark";
import { PilotContinuityView } from "./PilotContinuityView";
import { PilotHeader, PilotProgress, StepFrame } from "./PilotChrome";
import { claimLabels, pilotCopy, pt } from "./pilot-copy";
import {
  base64ToArrayBuffer,
  buildIntakePacket,
  buildOutcomeReport,
  buildRecoveryPacket,
  clearPilotState,
  deleteAttachment,
  deletePilotAttachments,
  downloadJson,
  getAttachment,
  loadPilotState,
  parsePreparedPacket,
  parseRecoveryPacket,
  putAttachment,
  replacePilotAttachments,
  savePilotState,
  sha256,
} from "./pilot-storage";
import {
  claimFieldOrder,
  createPilotState,
  effectiveClaimValue,
  type ClaimCorrection,
  type PilotAuditEvent,
  type PilotDecision,
  type PilotSource,
  type PilotStage,
  type PilotState,
  type SourceKind,
  type SourceStatus,
  type YesNoUnknown,
} from "./pilot-types";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const PILOT_EMAIL = "englishinstructordoha@gmail.com";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 12 * 1024 * 1024;
const MAX_TEXT_PER_SOURCE = 30_000;
const MAX_TOTAL_TEXT = 100_000;
const MAX_RECOVERY_PACKET_BYTES = 25 * 1024 * 1024;
const MAX_CONTINUITY_PACKET_BYTES = 2 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp";
const ACCEPTED_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt", "md", "csv", "json", "png", "jpg", "jpeg", "webp"]);

const sourceKindLabels: Record<SourceKind, { en: string; ar: string }> = {
  email: { en: "Email", ar: "بريد إلكتروني" },
  message: { en: "Message", ar: "رسالة" },
  note: { en: "Note", ar: "ملاحظة" },
  calendar: { en: "Calendar", ar: "تقويم" },
  document: { en: "Document", ar: "مستند" },
  spreadsheet: { en: "Spreadsheet", ar: "جدول بيانات" },
  screenshot: { en: "Screenshot", ar: "لقطة شاشة" },
  link: { en: "Link", ar: "رابط" },
  verbal: { en: "Verbal walkthrough", ar: "شرح شفهي" },
};

const sourceStatusLabels: Record<SourceStatus, { en: string; ar: string }> = {
  included: pilotCopy.included,
  redacted: pilotCopy.redacted,
  excluded: pilotCopy.excluded,
  needs_clarification: pilotCopy.clarification,
};

const outcomeLabels: Record<YesNoUnknown, { en: string; ar: string }> = {
  yes: pilotCopy.yes,
  no: pilotCopy.no,
  unknown: pilotCopy.unknown,
};

function nowIso() {
  return new Date().toISOString();
}

function eventId() {
  return globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sourceId() {
  return globalThis.crypto?.randomUUID?.() ?? `source-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseDateOnly(date: string) {
  if (!date) return null;
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function daysFromToday(date: string) {
  const target = parseDateOnly(date);
  if (!target) return null;
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.round((target.getTime() - localToday.getTime()) / 86_400_000);
}

function isBeforeExpectedReturn(date: string, now = new Date()) {
  if (!date) return false;
  const expectedStart = new Date(`${date}T00:00:00`);
  return !Number.isNaN(expectedStart.getTime()) && now.getTime() < expectedStart.getTime();
}

function formatDurationMinutes(minutes: number, language: Language) {
  if (minutes < 60) return language === "ar" ? `${Math.round(minutes)} دقيقة` : `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 48) return language === "ar" ? `${hours.toFixed(1)} ساعة` : `${hours.toFixed(1)} hours`;
  const days = hours / 24;
  return language === "ar" ? `${days.toFixed(1)} يوم` : `${days.toFixed(1)} days`;
}

function formatDate(value: string, language: Language) {
  const hasTime = value.includes("T");
  const parsed = hasTime ? new Date(value) : parseDateOnly(value);
  if (!parsed || Number.isNaN(parsed.getTime())) return value || "—";
  const formatted = new Intl.DateTimeFormat(language === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: hasTime ? "short" : undefined,
  }).format(parsed);
  if (!hasTime) return formatted;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timeZone ? `${formatted} (${timeZone})` : formatted;
}

function localDateInput(offsetDays: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextBusinessDayDeadline(from = new Date()) {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + 1);
  while (deadline.getDay() === 0 || deadline.getDay() === 6) deadline.setDate(deadline.getDate() + 1);
  deadline.setHours(17, 0, 0, 0);
  return deadline.toISOString();
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function participantError(error: unknown, language: Language, englishFallback: string, arabicFallback: string) {
  if (language === "ar") return arabicFallback;
  return error instanceof Error && error.message ? error.message : englishFallback;
}

function ForwardArrow({ language }: { language: Language }) {
  return language === "ar" ? <ArrowLeft aria-hidden /> : <ArrowRight aria-hidden />;
}

function BackArrow({ language }: { language: Language }) {
  return language === "ar" ? <ArrowRight aria-hidden /> : <ArrowLeft aria-hidden />;
}

function invalidateDerivedPilotState(current: PilotState): PilotState {
  const defaults = createPilotState(current.language);
  return {
    ...current,
    submission: { ...defaults.submission },
    continuity: null,
    corrections: [],
    confirmation: { ...defaults.confirmation },
    reentry: { ...defaults.reentry },
    result: { ...defaults.result },
  };
}

function PilotCheckbox({
  checked,
  onChange,
  children,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors has-[:checked]:border-primary/45 has-[:checked]:bg-primary/5", disabled && "cursor-not-allowed opacity-60")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 rounded border-input text-primary focus:ring-ring"
      />
      <span className="text-sm font-medium leading-6">{children}</span>
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  suffix,
  step = 1,
  disabled = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  suffix?: string;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
          className="h-12 w-full rounded-2xl border border-input bg-background px-4 pe-20 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-xs text-muted-foreground">{suffix}</span> : null}
      </div>
    </label>
  );
}

function ConfidenceField({ label, value, onChange, language, disabled = false }: { label: string; value: number | null; onChange: (value: number) => void; language: Language; disabled?: boolean }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <p className="mt-1 text-xs text-muted-foreground">{pt(pilotCopy.confidenceScale, language)}</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onChange(item)}
            disabled={disabled}
            aria-pressed={value === item}
            className="h-11 rounded-xl border border-border bg-surface text-sm font-bold outline-none transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function OutcomeChoice({ label, value, onChange, language, disabled = false }: { label: string; value: YesNoUnknown; onChange: (value: YesNoUnknown) => void; language: Language; disabled?: boolean }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["yes", "no", "unknown"] as const).map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onChange(option)}
            disabled={disabled}
            aria-pressed={value === option}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold outline-none aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pt(outcomeLabels[option], language)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StatusMessage({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const classes = {
    neutral: "border-border bg-muted/35 text-foreground",
    good: "border-confirmed/35 bg-confirmed/10 text-confirmed-foreground",
    warning: "border-openloop/45 bg-openloop/10 text-openloop-foreground",
    danger: "border-correction/45 bg-correction/10 text-correction-foreground",
  }[tone];
  return <div className={cn("rounded-2xl border p-4 text-sm leading-6", classes)}>{children}</div>;
}

function PilotUtilityCard({
  state,
  language,
  onExportRecovery,
  onImportRecovery,
}: {
  state: PilotState;
  language: Language;
  onExportRecovery: () => void | Promise<void>;
  onImportRecovery: (file: File) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const milestones = [
    { label: language === "ar" ? "تم تثبيت خط الأساس" : "Baseline locked", at: state.baseline.capturedAt },
    { label: language === "ar" ? "تم إعداد حزمة المواد" : "Material packet prepared", at: state.submission.packetPreparedAt },
    { label: language === "ar" ? "تم استيراد حالة الاستمرارية" : "Continuity state imported", at: state.continuity?.preparedAt ?? null },
    { label: language === "ar" ? "تم تأكيد الخيط" : "Thread confirmed", at: state.confirmation.confirmedAt },
    { label: language === "ar" ? "اكتملت العودة" : "Re-entry completed", at: state.reentry.completedAt },
    { label: language === "ar" ? "أُغلق سجل التجربة" : "Pilot record finalized", at: state.result.finalizedAt },
  ];

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"><Save className="size-4" /> {pt(pilotCopy.pilotContinuity, language)}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">ID: {state.pilotId.slice(0, 8)} · {pt(pilotCopy.savedLocal, language)}</p>
      <p className="mt-1 text-[0.68rem] text-muted-foreground">{pt(pilotCopy.lastChange, language)}: {formatDate(state.updatedAt, language)}</p>

      <details className="mt-4 rounded-2xl border border-border bg-muted/25 p-3">
        <summary className="cursor-pointer text-xs font-bold">{pt(pilotCopy.pilotRecord, language)} · {state.auditLog.length} {pt(pilotCopy.trackedEvents, language)}</summary>
        <ol className="mt-3 space-y-2">
          {milestones.map((milestone) => (
            <li key={milestone.label} className="flex items-start gap-2 text-xs">
              <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold", milestone.at ? "bg-confirmed text-confirmed-foreground" : "bg-muted text-muted-foreground")}>{milestone.at ? "✓" : "·"}</span>
              <span className={milestone.at ? "text-foreground" : "text-muted-foreground"}>{milestone.label}{milestone.at ? <span className="block text-[0.65rem] text-muted-foreground">{formatDate(milestone.at, language)}</span> : null}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="mt-3 text-xs font-bold text-primary underline underline-offset-4"
          onClick={() => downloadJson(`ulomis-audit-${state.pilotId.slice(0, 8)}.json`, {
            kind: "ulomis_pilot_audit",
            version: 1,
            pilotId: state.pilotId,
            exportedAt: nowIso(),
            events: state.auditLog,
          })}
        >
          {pt(pilotCopy.exportAudit, language)}
        </button>
      </details>

      <div className="mt-4 grid gap-2">
        <UButton variant="outline" size="sm" onClick={onExportRecovery}><Download /> {pt(pilotCopy.exportRecovery, language)}</UButton>
        <UButton variant="ghost" size="sm" onClick={() => inputRef.current?.click()}><FolderInput /> {pt(pilotCopy.importRecovery, language)}</UButton>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onImportRecovery(file);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function auditEvent(state: PilotState, name: string, stage: PilotStage, metadata?: PilotAuditEvent["metadata"]): PilotAuditEvent {
  return { id: eventId(), at: nowIso(), name, stage, metadata };
}

export function PilotFlow() {
  const [state, setState] = useState<PilotState | null>(null);
  const stateRef = useRef<PilotState | null>(null);
  const [storageError, setStorageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fatalError, setFatalError] = useState("");
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const loaded = loadPilotState();
    const next = loaded ?? createPilotState("en");
    stateRef.current = next;
    setState(next);
    trackEvent(loaded ? "pilot_resumed" : "pilot_opened", {
      pilotId: next.pilotId,
      pilotStage: next.stage,
      language: next.language,
    });
  }, []);

  useEffect(() => {
    if (!state) return;
    stateRef.current = state;
    const result = savePilotState(state);
    setStorageError(result.ok ? "" : result.reason);
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
  }, [state]);

  useEffect(() => {
    if (state?.stage !== "reentry" || !state.reentry.startedAt) return;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [state?.stage, state?.reentry.startedAt]);

  useEffect(() => {
    setConfirmAccuracy(false);
  }, [state?.continuity?.preparedAt]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center"><Loader2 className="mx-auto size-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">{pt(pilotCopy.openingPilot, "en")}</p></div>
      </div>
    );
  }

  const language = state.language;

  function commit(
    name: string,
    transform: (current: PilotState) => PilotState,
    metadata: Record<string, string | number | boolean | null> = {},
  ) {
    const current = stateRef.current;
    if (!current) return;
    const transformed = transform(current);
    const timestamp = nowIso();
    const next: PilotState = {
      ...transformed,
      updatedAt: timestamp,
      auditLog: [...current.auditLog, auditEvent(current, name, transformed.stage, metadata)],
    };
    stateRef.current = next;
    setState(next);
    trackEvent(name, {
      pilotId: next.pilotId,
      pilotStage: next.stage,
      language: next.language,
      ...metadata,
    });
  }

  function setLanguage(next: Language) {
    commit("pilot_language_changed", (current) => ({ ...current, language: next }), { language: next });
  }

  async function deletePilot() {
    const currentState = stateRef.current ?? state!;
    const message = `${pt(pilotCopy.deleteBoundary, language)} ${language === "ar" ? "هل تريد المتابعة؟" : "Continue?"}`;
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await deletePilotAttachments(currentState.pilotId);
      const stateResult = clearPilotState();
      if (!stateResult.ok) throw new Error(`Pilot state could not be deleted: ${stateResult.reason}`);
      const next = createPilotState(language);
      stateRef.current = next;
      setState(next);
      toast.success(language === "ar" ? "تم حذف حالة التجربة وملفاتها المحلية من هذا المتصفح." : "Pilot state and local files were deleted from this browser.");
      trackEvent("pilot_data_deleted", { pilotId: currentState.pilotId, pilotStage: currentState.stage, language });
    } catch (error) {
      toast.error(participantError(error, language, "Deletion could not be verified. Some local pilot data may remain; retry deletion or clear this site's storage in the browser.", "تعذّر التحقق من اكتمال الحذف. قد تبقى بعض بيانات التجربة محليًا؛ أعد المحاولة أو امسح بيانات هذا الموقع من إعدادات المتصفح."));
    } finally {
      setBusy(false);
    }
  }

  async function exportRecovery() {
    const currentState = stateRef.current ?? state!;
    setBusy(true);
    try {
      const packet = await buildRecoveryPacket(currentState);
      downloadJson(`ulomis-recovery-${currentState.pilotId.slice(0, 8)}.json`, packet);
      commit("pilot_recovery_exported", (current) => ({
        ...current,
        confirmation: { ...current.confirmation, recoveryExportedAt: nowIso() },
      }), { attachmentCount: packet.attachments.length });
    } catch (error) {
      toast.error(participantError(error, language, "Could not export the recovery file.", "تعذّر تصدير ملف الاستعادة. لا تغادر الصفحة قبل التواصل مع مسؤولة التجربة."));
    } finally {
      setBusy(false);
    }
  }

  async function importRecovery(file: File) {
    if (file.size > MAX_RECOVERY_PACKET_BYTES) {
      toast.error(language === "ar" ? "يتجاوز ملف الاستعادة حد 25 ميغابايت." : "The recovery file exceeds the 25 MB limit.");
      return;
    }
    setBusy(true);
    try {
      const parsed = parseRecoveryPacket(JSON.parse(await file.text()));
      const stateDigest = await sha256(JSON.stringify(parsed.state));
      if (stateDigest !== parsed.integrity.stateSha256) throw new Error("Recovery state integrity check failed.");
      const sourceIds = new Set<string>();
      const attachmentIds = new Set<string>();
      for (const source of parsed.state.sources) {
        if (sourceIds.has(source.id)) throw new Error(`Duplicate recovery source ID: ${source.id}.`);
        sourceIds.add(source.id);
      }
      for (const attachment of parsed.attachments) {
        if (attachmentIds.has(attachment.id)) throw new Error(`Duplicate recovery attachment ID: ${attachment.id}.`);
        attachmentIds.add(attachment.id);
      }
      const expectedAttachmentIds = new Set(parsed.state.sources.map((source) => source.attachmentId).filter((id): id is string => Boolean(id)));
      if (expectedAttachmentIds.size !== attachmentIds.size || [...expectedAttachmentIds].some((id) => !attachmentIds.has(id))) {
        throw new Error("Recovery attachment manifest does not match the saved thread state.");
      }
      for (const source of parsed.state.sources) {
        if (!source.attachmentId) {
          const material = source.kind === "link" ? source.link : source.text;
          if (await sha256(material) !== source.sha256) throw new Error(`Recovery source integrity check failed for ${source.label}.`);
        }
      }
      const verifiedAttachments = [];
      for (const attachment of parsed.attachments) {
        if (attachment.pilotId !== parsed.state.pilotId) throw new Error(`Recovery attachment ${attachment.name} belongs to a different pilot.`);
        const source = parsed.state.sources.find((item) => item.attachmentId === attachment.id);
        if (!source) throw new Error(`Recovery attachment ${attachment.name} is not referenced by the thread state.`);
        const data = base64ToArrayBuffer(attachment.base64);
        const digest = await sha256(data);
        if (digest !== attachment.sha256 || digest !== source.sha256) throw new Error(`Recovery attachment integrity check failed for ${attachment.name}.`);
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
      const activePilotId = stateRef.current?.pilotId;
      await replacePilotAttachments(parsed.state.pilotId, verifiedAttachments);
      if (activePilotId && activePilotId !== parsed.state.pilotId) {
        await deletePilotAttachments(activePilotId).catch(() => undefined);
      }
      stateRef.current = parsed.state;
      setState(parsed.state);
      trackEvent("pilot_recovery_imported", { pilotId: parsed.state.pilotId, pilotStage: parsed.state.stage, language: parsed.state.language, attachmentCount: parsed.attachments.length });
      toast.success(language === "ar" ? "تمت استعادة التجربة من ملف الاستعادة." : "Pilot restored from the recovery file.");
    } catch (error) {
      toast.error(participantError(error, language, "Could not import this recovery file.", "تعذّر استيراد ملف الاستعادة. تأكد من اختيار ملف الاستعادة الصحيح وغير المعدّل."));
    } finally {
      setBusy(false);
    }
  }

  function recordSourceReopened(source: PilotSource) {
    const current = stateRef.current;
    if (!current || current.stage !== "reentry" || current.reentry.sourceIdsOpenedFromUlomis.includes(source.id)) return;
    commit("pilot_source_reopened_from_evidence", (active) => {
      if (active.reentry.sourceIdsOpenedFromUlomis.includes(source.id)) return active;
      const sourceIdsOpenedFromUlomis = [...active.reentry.sourceIdsOpenedFromUlomis, source.id];
      return {
        ...active,
        reentry: {
          ...active.reentry,
          sourceIdsOpenedFromUlomis,
          sourcesReopened: sourceIdsOpenedFromUlomis.length + active.reentry.otherSourcesReopened,
        },
      };
    }, { sourceKind: source.kind });
  }

  async function openParticipantAttachment(source: PilotSource, countForReentry: boolean) {
    if (!source.attachmentId) return;
    setBusy(true);
    try {
      const record = await getAttachment(source.attachmentId);
      if (!record) throw new Error("The local attachment is no longer available.");
      const digest = await sha256(record.data);
      if (digest !== source.sha256 || digest !== record.sha256) throw new Error("The local attachment integrity check failed.");
      const blob = new Blob([record.data], { type: record.type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = record.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
      if (countForReentry) recordSourceReopened(source);
    } catch (error) {
      toast.error(participantError(error, language, "Could not open this local attachment.", "تعذّر فتح هذا المرفق المحلي. تحقق من ملف الاستعادة أو أضف المصدر مجددًا."));
    } finally {
      setBusy(false);
    }
  }

  const utilityCard = (
    <PilotUtilityCard state={state} language={language} onExportRecovery={exportRecovery} onImportRecovery={importRecovery} />
  );

  return (
    <div className="min-h-screen bg-background" data-pilot-stage={state.stage}>
      <PilotHeader language={language} onLanguageChange={setLanguage} onDelete={deletePilot} />
      <PilotProgress stage={state.stage} language={language} />
      {storageError ? (
        <div className="border-b border-correction/35 bg-correction/10 px-4 py-3 text-sm text-correction-foreground">
          <div className="mx-auto flex max-w-7xl items-start gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" /> {pt(pilotCopy.saveFailed, language)} <button type="button" onClick={exportRecovery} className="font-bold underline">{pt(pilotCopy.exportRecovery, language)}</button></div>
        </div>
      ) : null}
      {fatalError ? (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"><StatusMessage tone="danger"><strong>{pt(pilotCopy.actionNeeded, language)}:</strong> {fatalError}</StatusMessage></div>
      ) : null}

      {state.stage === "welcome" ? (
        <WelcomeStep state={state} language={language} utilityCard={utilityCard} onStart={() => commit("pilot_started", (current) => ({ ...current, stage: "qualification" }))} />
      ) : null}
      {state.stage === "qualification" ? (
        <QualificationStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          update={(qualification) => commit("pilot_qualification_updated", (current) => ({ ...current, qualification }), { complete: isQualificationValid(qualification) })}
          onBack={() => commit("pilot_step_back", (current) => ({ ...current, stage: "welcome" }))}
          onContinue={() => {
            if (!isQualificationValid(state.qualification)) {
              setFatalError(pt(pilotCopy.qualificationError, language));
              return;
            }
            setFatalError("");
            commit("pilot_thread_qualified", (current) => ({
              ...current,
              stage: "baseline",
              qualification: { ...current.qualification, confirmedAt: nowIso() },
            }), { returnWindowDays: daysFromToday(state.qualification.expectedReturnDate) ?? -1 });
          }}
        />
      ) : null}
      {state.stage === "baseline" ? (
        <BaselineStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          update={(baseline) => commit("pilot_baseline_updated", (current) => ({ ...current, baseline }), { complete: isBaselineValid(baseline) })}
          onBack={() => commit("pilot_step_back", (current) => ({ ...current, stage: "qualification" }))}
          onContinue={() => {
            if (!isBaselineValid(state.baseline)) {
              setFatalError(language === "ar" ? "أكمل جميع قياسات خط الأساس، وتأكد من أن الدقائق الإدارية لا تتجاوز زمن العودة الكلي." : "Complete every baseline measure and keep admin minutes within the total re-entry time.");
              return;
            }
            setFatalError("");
            commit("pilot_baseline_captured", (current) => ({
              ...current,
              stage: "intake",
              baseline: { ...current.baseline, capturedAt: nowIso() },
            }), {
              normalReentryMinutes: state.baseline.normalReentryMinutes ?? 0,
              normalAdminMinutes: state.baseline.normalAdminMinutes ?? 0,
              normalSources: state.baseline.sourcesNormallyOpened ?? 0,
              normalPeople: state.baseline.peopleNormallyContacted ?? 0,
            });
          }}
        />
      ) : null}
      {state.stage === "intake" ? (
        <IntakeStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          busy={busy}
          updateState={(name, transform, metadata) => commit(name, transform, metadata)}
          setBusy={setBusy}
          setError={setFatalError}
          onBack={() => commit("pilot_step_back", (current) => ({ ...current, stage: "baseline" }))}
          onPrepare={async () => {
            if (!isIntakeValid(state)) {
              setFatalError(language === "ar" ? "أضف مصدرين صالحين على الأقل وأكّد حدود المشاركة الثلاثة." : "Add at least two valid sources and confirm all three sharing boundaries.");
              return;
            }
            setBusy(true);
            setFatalError("");
            try {
              const consentConfirmedAt = state.consent.confirmedAt ?? nowIso();
              const preparedState = { ...state, consent: { ...state.consent, confirmedAt: consentConfirmedAt } };
              const packet = await buildIntakePacket(preparedState);
              const fileName = `ulomis-intake-${state.pilotId.slice(0, 8)}.json`;
              downloadJson(fileName, packet);
              commit("pilot_packet_exported", (current) => ({
                ...current,
                stage: "processing",
                submission: {
                  ...current.submission,
                  packetPreparedAt: packet.exportedAt,
                  packetFileName: fileName,
                  packetSentAt: null,
                  targetDeliveryAt: null,
                  clarificationRequested: false,
                },
                consent: { ...current.consent, confirmedAt: consentConfirmedAt },
              }), { sourceCount: state.sources.filter((source) => source.status !== "excluded").length, attachmentCount: packet.attachments.length });
              toast.success(language === "ar" ? "تم تنزيل حزمة التجربة." : "Pilot packet downloaded.");
            } catch (error) {
              setFatalError(participantError(error, language, "Could not prepare the pilot packet.", "تعذّر إعداد حزمة التجربة. تحقق من أن جميع الملفات ما زالت محفوظة في هذا المتصفح ثم حاول مجددًا."));
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
      {state.stage === "processing" ? (
        <ProcessingStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          busy={busy}
          onDownloadAgain={async () => {
            setBusy(true);
            try {
              const packet = await buildIntakePacket(state);
              downloadJson(state.submission.packetFileName ?? `ulomis-intake-${state.pilotId.slice(0, 8)}.json`, packet);
              commit("pilot_packet_redownloaded", (current) => current);
            } catch (error) {
              setFatalError(participantError(error, language, "Could not rebuild the packet.", "تعذّر إعادة إنشاء الحزمة. تحقق من المواد المحلية أو استخدم ملف الاستعادة."));
            } finally {
              setBusy(false);
            }
          }}
          onMarkSent={() => {
            const sentAt = nowIso();
            const targetDeliveryAt = nextBusinessDayDeadline(new Date(sentAt));
            commit("pilot_packet_marked_sent", (current) => ({
              ...current,
              submission: { ...current.submission, packetSentAt: sentAt, targetDeliveryAt },
            }), { targetDeliveryAt });
          }}
          onImport={async (file) => {
            if (!state.submission.packetSentAt) {
              setFatalError(language === "ar" ? "أكّد أولًا أنك أرفقت الحزمة وأرسلتها قبل استيراد ملف الاستمرارية المعاد." : "First confirm that you attached and sent the packet before importing the returned continuity file.");
              return;
            }
            if (file.size > MAX_CONTINUITY_PACKET_BYTES) {
              setFatalError(language === "ar" ? "يتجاوز ملف الاستمرارية حد 2 ميغابايت." : "The continuity file exceeds the 2 MB limit.");
              return;
            }
            setBusy(true);
            try {
              const packet = parsePreparedPacket(JSON.parse(await file.text()), state.pilotId);
              validateSourceManifest(packet.sourceManifest, state.sources);
              validatePreparedContinuity(packet.continuity.claims, packet.sourceManifest.map((source) => source.id));
              const nextAction = packet.continuity.claims.find((claim) => claim.field === "nextAction")?.value ?? "";
              commit("pilot_continuity_imported", (current) => ({
                ...current,
                stage: "review",
                continuity: packet.continuity,
                corrections: [],
                confirmation: {
                  confirmedAt: null,
                  selectedNextAction: nextAction,
                  pauseStartedAt: null,
                  recoveryExportedAt: null,
                },
              }), { claimCount: packet.continuity.claims.length });
              toast.success(language === "ar" ? "تم استيراد عرض الاستمرارية." : "Continuity view imported.");
            } catch (error) {
              setFatalError(participantError(error, language, "Could not import this continuity file.", "تعذّر استيراد ملف الاستمرارية. تأكد من أنه الملف الصحيح لهذه التجربة وأن الأدلة لم تتغير."));
            } finally {
              setBusy(false);
            }
          }}
          onBack={() => {
            if (state.submission.packetSentAt && !window.confirm(pt(pilotCopy.returnToIntakeConfirm, language))) return;
            commit("pilot_step_back", (current) => ({ ...current, stage: "intake" }));
          }}
        />
      ) : null}
      {state.stage === "review" && state.continuity ? (
        <ReviewStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          confirmAccuracy={confirmAccuracy}
          setConfirmAccuracy={setConfirmAccuracy}
          onCorrection={(correction) => {
            commit("pilot_claim_reviewed", (current) => {
              const withoutCurrent = current.corrections.filter((item) => item.claimId !== correction.claimId);
              let corrections = [...withoutCurrent, correction];
              if (correction.revisedNextAction.trim() && current.continuity) {
                const nextAction = current.continuity.claims.find((claim) => claim.field === "nextAction");
                if (nextAction) {
                  corrections = [
                    ...corrections.filter((item) => item.claimId !== nextAction.id),
                    {
                      claimId: nextAction.id,
                      choice: "partial",
                      correctedValue: correction.revisedNextAction.trim(),
                      reason: language === "ar" ? "تم التحديث لأن بندًا جوهريًا آخر في الحالة تغيّر." : "Updated because another material state item changed.",
                      revisedNextAction: "",
                      createdAt: correction.createdAt,
                    },
                  ];
                }
              }
              return { ...current, corrections };
            }, { correctionType: correction.choice, changedNextAction: Boolean(correction.revisedNextAction.trim()) });
          }}
          onOpenAttachment={(source) => openParticipantAttachment(source, false)}
          onBack={() => commit("pilot_step_back", (current) => ({ ...current, stage: "processing" }))}
          onConfirm={() => {
            if (!confirmAccuracy) {
              setFatalError(language === "ar" ? "أكّد أن الحالة دقيقة بما يكفي للعودة منها." : "Confirm that the state is accurate enough to resume from.");
              return;
            }
            const selectedNextAction = getEffectiveNextAction(state);
            if (!selectedNextAction.trim()) {
              setFatalError(language === "ar" ? "تحتاج الحالة المؤكدة إلى خطوة تالية صريحة واحدة." : "A confirmed thread needs one explicit next action.");
              return;
            }
            setFatalError("");
            commit("pilot_thread_confirmed", (current) => ({
              ...current,
              stage: "awaiting_reentry",
              confirmation: {
                ...current.confirmation,
                confirmedAt: nowIso(),
                selectedNextAction,
                pauseStartedAt: nowIso(),
              },
            }), { correctionsCount: state.corrections.filter((item) => item.choice !== "correct").length });
          }}
        />
      ) : null}
      {state.stage === "awaiting_reentry" ? (
        <AwaitingReentryStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          onExportRecovery={exportRecovery}
          onStart={() => {
            const earlyReturn = isBeforeExpectedReturn(state.qualification.expectedReturnDate);
            if (earlyReturn && !window.confirm(pt(pilotCopy.earlyReturnConfirm, language))) return;
            commit("pilot_reentry_started", (current) => ({
              ...current,
              stage: "reentry",
              reentry: {
                ...current.reentry,
                startedAt: nowIso(),
                earlyReturnConfirmed: earlyReturn,
                completedAt: null,
                actualReentrySeconds: null,
                sourceIdsOpenedFromUlomis: [],
                otherSourcesReopened: 0,
                sourcesReopened: 0,
                peopleContacted: 0,
              },
            }), { earlyReturn });
          }}
          onCopyLink={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success(language === "ar" ? "تم نسخ رابط العودة." : "Return link copied.");
              commit("pilot_return_link_copied", (current) => current);
            } catch {
              toast.error(language === "ar" ? "تعذّر النسخ. احفظ هذه الصفحة في الإشارات المرجعية بدلًا من ذلك." : "Copy failed. Bookmark this page instead.");
            }
          }}
        />
      ) : null}
      {state.stage === "reentry" && state.continuity && state.reentry.startedAt ? (
        <ReentryStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          elapsedSeconds={Math.max(0, Math.floor((clock - new Date(state.reentry.startedAt).getTime()) / 1000))}
          updateCounter={(key, delta) => commit("pilot_reentry_counter_updated", (current) => {
            if (key === "otherSourcesReopened") {
              const otherSourcesReopened = Math.max(0, current.reentry.otherSourcesReopened + delta);
              return {
                ...current,
                reentry: {
                  ...current.reentry,
                  otherSourcesReopened,
                  sourcesReopened: current.reentry.sourceIdsOpenedFromUlomis.length + otherSourcesReopened,
                },
              };
            }
            return { ...current, reentry: { ...current.reentry, peopleContacted: Math.max(0, current.reentry.peopleContacted + delta) } };
          }, { counter: key, delta })}
          onOpenAttachment={(source) => openParticipantAttachment(source, true)}
          onSourceReferenceOpened={recordSourceReopened}
          onReady={() => {
            const seconds = Math.max(1, Math.floor((Date.now() - new Date(state.reentry.startedAt!).getTime()) / 1000));
            commit("pilot_reentry_completed", (current) => ({
              ...current,
              stage: "result",
              reentry: { ...current.reentry, completedAt: nowIso(), actualReentrySeconds: seconds },
            }), { actualReentrySeconds: seconds, sourcesReopened: state.reentry.sourcesReopened, peopleContacted: state.reentry.peopleContacted });
          }}
        />
      ) : null}
      {state.stage === "result" ? (
        <ResultStep
          state={state}
          language={language}
          utilityCard={utilityCard}
          update={(reentry) => commit("pilot_outcome_updated", (current) => ({ ...current, reentry }))}
          setDecision={(decision) => commit("pilot_decision_selected", (current) => ({ ...current, result: { ...current.result, decision } }), { decision })}
          onFinalize={() => {
            if (!isOutcomeValid(state)) {
              setFatalError(language === "ar" ? "أكمل وقت الإدارة ضمن زمن العودة، ومقاييس الثقة بعد العودة، واختر قرار المتابعة." : "Record admin time within the observed re-entry time, complete the after-confidence measures, and choose a continuation decision.");
              return;
            }
            setFatalError("");
            commit("pilot_record_finalized", (current) => ({ ...current, result: { ...current.result, finalizedAt: nowIso() } }), {
              decision: state.result.decision ?? "none",
              actualReentrySeconds: state.reentry.actualReentrySeconds ?? 0,
            });
          }}
          onExportOutcome={() => {
            downloadJson(`ulomis-outcome-${state.pilotId.slice(0, 8)}.json`, buildOutcomeReport(state));
            commit("pilot_outcome_exported", (current) => current);
          }}
          onExportArchive={async () => {
            setBusy(true);
            try {
              const intake = await buildIntakePacket(state);
              downloadJson(`ulomis-full-pilot-${state.pilotId.slice(0, 8)}.json`, {
                kind: "ulomis_full_pilot_archive",
                version: 1,
                exportedAt: nowIso(),
                state,
                attachments: intake.attachments,
              });
              commit("pilot_archive_exported", (current) => current, { attachmentCount: intake.attachments.length });
            } catch (error) {
              setFatalError(participantError(error, language, "Could not export the pilot archive.", "تعذّر تصدير أرشيف التجربة. صدّر ملف الاستعادة وتواصل مع مسؤولة التجربة."));
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {busy ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="rounded-3xl border border-border bg-surface p-6 text-center shadow-[var(--shadow-lift)]"><Loader2 className="mx-auto size-8 animate-spin text-primary" /><p className="mt-3 text-sm font-semibold">{pt(pilotCopy.workingLocally, language)}</p></div>
        </div>
      ) : null}
    </div>
  );
}

function isQualificationValid(qualification: PilotState["qualification"]) {
  const days = daysFromToday(qualification.expectedReturnDate);
  return Boolean(
    qualification.threadLabel.trim() &&
      qualification.summary.trim() &&
      days != null &&
      days >= 2 &&
      days <= 7 &&
      qualification.active &&
      qualification.clientFacing &&
      qualification.multiSource &&
      qualification.hasOpenLoop &&
      qualification.safeToShare,
  );
}

function isBaselineValid(baseline: PilotState["baseline"]) {
  return Boolean(
    baseline.normalReentryMinutes != null && baseline.normalReentryMinutes > 0 &&
      baseline.normalAdminMinutes != null && baseline.normalAdminMinutes >= 0 &&
      baseline.normalAdminMinutes <= baseline.normalReentryMinutes &&
      baseline.sourcesNormallyOpened != null && baseline.sourcesNormallyOpened >= 2 &&
      baseline.peopleNormallyContacted != null && baseline.peopleNormallyContacted >= 0 &&
      baseline.stateConfidence != null &&
      baseline.nextActionConfidence != null &&
      baseline.primaryFriction.trim(),
  );
}

function isIntakeValid(state: PilotState) {
  const validSources = state.sources.filter((source) => source.status === "included" || source.status === "redacted");
  return validSources.length >= 2 && state.consent.permissionConfirmed && state.consent.redactionConfirmed && state.consent.localBoundaryConfirmed;
}

function validateSourceManifest(
  manifest: Array<Pick<PilotSource, "id" | "label" | "kind" | "sha256">>,
  currentSources: PilotSource[],
) {
  const transferableSources = currentSources.filter((source) => source.status !== "excluded");
  const manifestById = new Map(manifest.map((source) => [source.id, source]));
  if (manifestById.size !== manifest.length) throw new Error("The prepared continuity file contains duplicate source references.");
  if (manifest.length !== transferableSources.length) {
    throw new Error("The source set changed after the pilot packet was prepared. Export a new packet before importing this continuity file.");
  }
  for (const source of transferableSources) {
    const prepared = manifestById.get(source.id);
    if (!prepared || prepared.sha256 !== source.sha256 || prepared.kind !== source.kind) {
      throw new Error(`Source integrity mismatch for ${source.label}. Export a new intake packet and reconstruct from the current evidence.`);
    }
  }
}

function validatePreparedContinuity(claims: NonNullable<PilotState["continuity"]>["claims"], sourceIds: string[]) {
  const fields = new Set(claims.map((claim) => claim.field));
  const missing = claimFieldOrder.filter((field) => !fields.has(field));
  if (missing.length) throw new Error(`Prepared continuity is missing: ${missing.join(", ")}.`);
  const ids = new Set<string>();
  for (const claim of claims) {
    if (ids.has(claim.id)) throw new Error(`Duplicate claim ID: ${claim.id}.`);
    ids.add(claim.id);
    if (!claim.value.trim()) throw new Error(`${claim.field} is empty.`);
    if (!(claim.confidence >= 0 && claim.confidence <= 1)) throw new Error(`${claim.field} has invalid confidence.`);
    if (!claim.sourceIds.length) throw new Error(`${claim.field} needs at least one supporting source.`);
    const missingSources = claim.sourceIds.filter((id) => !sourceIds.includes(id));
    if (missingSources.length) throw new Error(`${claim.field} references unknown source IDs: ${missingSources.join(", ")}.`);
  }
}

function getEffectiveNextAction(state: PilotState) {
  if (!state.continuity) return state.confirmation.selectedNextAction;
  const claim = state.continuity.claims.find((item) => item.field === "nextAction");
  if (!claim) return state.confirmation.selectedNextAction;
  return effectiveClaimValue(claim, state.corrections).value;
}

function isOutcomeValid(state: PilotState) {
  const actualReentryMinutes = (state.reentry.actualReentrySeconds ?? 0) / 60;
  return state.reentry.actualAdminMinutes != null &&
    state.reentry.actualAdminMinutes >= 0 &&
    state.reentry.actualAdminMinutes <= actualReentryMinutes + 0.05 &&
    state.reentry.stateConfidenceAfter != null &&
    state.reentry.nextActionConfidenceAfter != null &&
    state.result.decision != null;
}

function WelcomeStep({ state, language, utilityCard, onStart }: { state: PilotState; language: Language; utilityCard: ReactNode; onStart: () => void }) {
  const sequence = [
    { title: pilotCopy.sequenceChooseTitle, body: pilotCopy.sequenceChooseBody },
    { title: pilotCopy.sequenceBaselineTitle, body: pilotCopy.sequenceBaselineBody },
    { title: pilotCopy.sequenceMaterialTitle, body: pilotCopy.sequenceMaterialBody },
    { title: pilotCopy.sequenceReviewTitle, body: pilotCopy.sequenceReviewBody },
    { title: pilotCopy.sequenceReturnTitle, body: pilotCopy.sequenceReturnBody },
    { title: pilotCopy.sequenceResultTitle, body: pilotCopy.sequenceResultBody },
  ];
  return (
    <StepFrame
      eyebrow={pt(pilotCopy.welcomeEyebrow, language)}
      title={pt(pilotCopy.welcomeTitle, language)}
      body={pt(pilotCopy.welcomeBody, language)}
      time={pt(pilotCopy.welcomeTime, language)}
      next={pt(pilotCopy.welcomeNext, language)}
      language={language}
      aside={utilityCard}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: UserRoundCheck, title: pilotCopy.yourPart, body: pilotCopy.yourPartBody },
          { icon: FolderInput, title: pilotCopy.ourPart, body: pilotCopy.ourPartBody },
          { icon: BarChart3, title: pilotCopy.success, body: pilotCopy.successBody },
        ].map(({ icon: Icon, title, body }) => (
          <UCard key={title.en} variant="plain" padding="md">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold">{pt(title, language)}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{pt(body, language)}</p>
          </UCard>
        ))}
      </div>
      <StatusMessage tone="neutral"><strong>{state.organization}:</strong> {pt(pilotCopy.referallPromise, language)}</StatusMessage>
      <StatusMessage tone="neutral">{pt(pilotCopy.notFeedbackSession, language)}</StatusMessage>
      <div className="mt-8 rounded-3xl border border-border bg-surface p-5 sm:p-7">
        <h2 className="text-lg font-semibold">{pt(pilotCopy.exactSequence, language)}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2">
          {sequence.map((item, index) => (
            <li key={item.title.en} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
              <div><p className="text-sm font-semibold">{pt(item.title, language)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{pt(item.body, language)}</p></div>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <UButton size="lg" onClick={onStart}>{pt(pilotCopy.begin, language)} <ForwardArrow language={language} /></UButton>
        {state.stage !== "welcome" ? <span>{pt(pilotCopy.resume, language)}</span> : null}
      </div>
    </StepFrame>
  );
}

function QualificationStep({ state, language, utilityCard, update, onBack, onContinue }: { state: PilotState; language: Language; utilityCard: ReactNode; update: (qualification: PilotState["qualification"]) => void; onBack: () => void; onContinue: () => void }) {
  const q = state.qualification;
  const valid = isQualificationValid(q);
  const set = <K extends keyof typeof q>(key: K, value: (typeof q)[K]) => update({ ...q, [key]: value });
  const minDate = localDateInput(2);
  const maxDate = localDateInput(7);
  return (
    <StepFrame title={pt(pilotCopy.qualificationTitle, language)} body={pt(pilotCopy.qualificationBody, language)} time={pt(pilotCopy.qualificationTime, language)} next={pt(pilotCopy.qualificationNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-3xl space-y-6">
        <UCard padding="lg">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="text-sm font-semibold">{pt(pilotCopy.threadLabel, language)}</span><input value={q.threadLabel} onChange={(event) => set("threadLabel", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" placeholder={pt(pilotCopy.placeholderThread, language)} /><span className="mt-2 block text-xs text-muted-foreground">{pt(pilotCopy.threadLabelHelp, language)}</span></label>
            <label className="block"><span className="text-sm font-semibold">{pt(pilotCopy.expectedReturn, language)}</span><input type="date" min={minDate} max={maxDate} value={q.expectedReturnDate} onChange={(event) => set("expectedReturnDate", event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="block sm:col-span-2"><span className="text-sm font-semibold">{pt(pilotCopy.shortContext, language)}</span><textarea rows={3} value={q.summary} onChange={(event) => set("summary", event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder={pt(pilotCopy.placeholderContext, language)} /></label>
          </div>
        </UCard>
        <div className="grid gap-3">
          <PilotCheckbox checked={q.active} onChange={(value) => set("active", value)}>{pt(pilotCopy.active, language)}</PilotCheckbox>
          <PilotCheckbox checked={q.clientFacing} onChange={(value) => set("clientFacing", value)}>{pt(pilotCopy.clientFacing, language)}</PilotCheckbox>
          <PilotCheckbox checked={q.multiSource} onChange={(value) => set("multiSource", value)}>{pt(pilotCopy.multiSource, language)}</PilotCheckbox>
          <PilotCheckbox checked={q.hasOpenLoop} onChange={(value) => set("hasOpenLoop", value)}>{pt(pilotCopy.hasOpenLoop, language)}</PilotCheckbox>
          <PilotCheckbox checked={q.safeToShare} onChange={(value) => set("safeToShare", value)}>{pt(pilotCopy.safeToShare, language)}</PilotCheckbox>
        </div>
        <StatusMessage tone={valid ? "good" : "warning"}>{valid ? <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> {pt(pilotCopy.suitable, language)}</span> : pt(pilotCopy.qualificationError, language)}</StatusMessage>
        <div className="flex flex-wrap gap-3"><UButton variant="ghost" onClick={onBack}><BackArrow language={language} /> {pt(pilotCopy.back, language)}</UButton><UButton onClick={onContinue} disabled={!valid}>{pt(pilotCopy.lockThread, language)} <ForwardArrow language={language} /></UButton></div>
      </div>
    </StepFrame>
  );
}

function BaselineStep({ state, language, utilityCard, update, onBack, onContinue }: { state: PilotState; language: Language; utilityCard: ReactNode; update: (baseline: PilotState["baseline"]) => void; onBack: () => void; onContinue: () => void }) {
  const b = state.baseline;
  const set = <K extends keyof typeof b>(key: K, value: (typeof b)[K]) => update({ ...b, [key]: value });
  return (
    <StepFrame title={pt(pilotCopy.baselineTitle, language)} body={pt(pilotCopy.baselineBody, language)} time={pt(pilotCopy.baselineTime, language)} next={pt(pilotCopy.baselineNext, language)} language={language} aside={utilityCard}>
      <UCard padding="lg" className="max-w-3xl">
        <StatusMessage tone="neutral">{pt(pilotCopy.baselineDefinitions, language)}</StatusMessage>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField label={pt(pilotCopy.normalMinutes, language)} value={b.normalReentryMinutes} onChange={(value) => set("normalReentryMinutes", value)} min={1} max={240} suffix={pt(pilotCopy.minutes, language)} />
          <NumberField label={pt(pilotCopy.normalAdminMinutes, language)} value={b.normalAdminMinutes} onChange={(value) => set("normalAdminMinutes", value)} min={0} max={240} suffix={pt(pilotCopy.minutes, language)} />
          <NumberField label={pt(pilotCopy.normalSources, language)} value={b.sourcesNormallyOpened} onChange={(value) => set("sourcesNormallyOpened", value)} min={2} max={50} />
          <NumberField label={pt(pilotCopy.normalPeople, language)} value={b.peopleNormallyContacted} onChange={(value) => set("peopleNormallyContacted", value)} min={0} max={20} />
          <div className="sm:col-span-2 lg:col-span-4 grid gap-6 sm:grid-cols-2">
            <ConfidenceField label={pt(pilotCopy.stateConfidence, language)} value={b.stateConfidence} onChange={(value) => set("stateConfidence", value)} language={language} />
            <ConfidenceField label={pt(pilotCopy.actionConfidence, language)} value={b.nextActionConfidence} onChange={(value) => set("nextActionConfidence", value)} language={language} />
          </div>
          <label className="block sm:col-span-2 lg:col-span-4"><span className="text-sm font-semibold">{pt(pilotCopy.friction, language)}</span><textarea rows={3} value={b.primaryFriction} onChange={(event) => set("primaryFriction", event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" placeholder={pt(pilotCopy.placeholderFriction, language)} /></label>
        </div>
      </UCard>
      <div className="mt-6 flex flex-wrap gap-3"><UButton variant="ghost" onClick={onBack}><BackArrow language={language} /> {pt(pilotCopy.back, language)}</UButton><UButton onClick={onContinue} disabled={!isBaselineValid(b)}>{pt(pilotCopy.lockBaseline, language)} <ForwardArrow language={language} /></UButton></div>
    </StepFrame>
  );
}

function IntakeStep({ state, language, utilityCard, busy, updateState, setBusy, setError, onBack, onPrepare }: {
  state: PilotState;
  language: Language;
  utilityCard: ReactNode;
  busy: boolean;
  updateState: (name: string, transform: (current: PilotState) => PilotState, metadata?: Record<string, string | number | boolean | null>) => void;
  setBusy: (busy: boolean) => void;
  setError: (error: string) => void;
  onBack: () => void;
  onPrepare: () => void;
}) {
  const [mode, setMode] = useState<"text" | "link">("text");
  const [kind, setKind] = useState<SourceKind>("email");
  const [label, setLabel] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<SourceStatus>("included");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totalFileBytes = state.sources.reduce((sum, source) => sum + (source.fileSize ?? 0), 0);
  const totalTextChars = state.sources.reduce((sum, source) => sum + source.text.length + source.link.length, 0);

  async function addTextSource() {
    const content = mode === "link" ? link.trim() : text.trim();
    if (!label.trim() || !content) {
      setError(language === "ar" ? "أضف عنوانًا ومحتوى للمصدر." : "Add a source label and content.");
      return;
    }
    if (content.length > MAX_TEXT_PER_SOURCE || totalTextChars + content.length > MAX_TOTAL_TEXT) {
      setError(language === "ar" ? `اجعل كل مصدر ملصق أقل من ${MAX_TEXT_PER_SOURCE.toLocaleString()} حرفًا، والمجموع أقل من ${MAX_TOTAL_TEXT.toLocaleString()} حرف.` : `Keep each pasted source under ${MAX_TEXT_PER_SOURCE.toLocaleString()} characters and the total under ${MAX_TOTAL_TEXT.toLocaleString()} characters.`);
      return;
    }
    if (mode === "link") {
      try {
        const parsed = new URL(content);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        setError(language === "ar" ? "أضف رابطًا كاملًا يبدأ بـ http:// أو https://." : "Add a complete http:// or https:// reference URL.");
        return;
      }
    }
    setBusy(true);
    try {
      const id = sourceId();
      const source: PilotSource = {
        id,
        kind: mode === "link" ? "link" : kind,
        label: label.trim(),
        sourceDate: sourceDate.trim(),
        status,
        text: mode === "text" ? text.trim() : "",
        link: mode === "link" ? link.trim() : "",
        attachmentId: null,
        fileName: null,
        mimeType: null,
        fileSize: null,
        sha256: await sha256(content),
        addedAt: nowIso(),
      };
      updateState("pilot_source_added", (current) => {
        const next = invalidateDerivedPilotState(current);
        return { ...next, sources: [...current.sources, source] };
      }, { sourceKind: source.kind, sourceStatus: source.status, priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) });
      setLabel(""); setSourceDate(""); setText(""); setLink(""); setError("");
    } catch (error) {
      setError(participantError(error, language, "Could not add this source or create its integrity check.", "تعذّر إضافة هذا المصدر أو إنشاء فحص سلامته. استخدم متصفحًا حديثًا وحاول مجددًا."));
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      let runningTotal = totalFileBytes;
      for (const file of files) {
        const extension = file.name.toLowerCase().split(".").pop() ?? "";
        if (!ACCEPTED_EXTENSIONS.has(extension)) throw new Error(`${file.name} is not an accepted pilot file type.`);
        if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds the 5 MB per-file limit.`);
        if (runningTotal + file.size > MAX_TOTAL_FILE_BYTES) throw new Error("The selected files exceed the 12 MB total pilot limit.");
        const data = await file.arrayBuffer();
        const id = sourceId();
        const digest = await sha256(data);
        await putAttachment({ id, pilotId: state.pilotId, name: file.name, type: file.type || "application/octet-stream", size: file.size, sha256: digest, addedAt: nowIso(), data });
        const fileKind: SourceKind = file.type.startsWith("image/") ? "screenshot" : file.name.toLowerCase().endsWith(".csv") ? "spreadsheet" : "document";
        const source: PilotSource = {
          id,
          kind: fileKind,
          label: file.name,
          sourceDate: "",
          status: "included",
          text: "",
          link: "",
          attachmentId: id,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          sha256: digest,
          addedAt: nowIso(),
        };
        updateState("pilot_file_added", (current) => {
          const next = invalidateDerivedPilotState(current);
          return { ...next, sources: [...current.sources, source] };
        }, { sourceKind: fileKind, fileSize: file.size, priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) });
        runningTotal += file.size;
      }
    } catch (error) {
      setError(participantError(error, language, "Could not store the selected file locally.", "تعذّر حفظ الملف المحدد محليًا. تحقق من نوع الملف وحجمه ومساحة تخزين المتصفح."));
    } finally {
      setBusy(false);
    }
  }

  async function removeSource(source: PilotSource) {
    if (source.attachmentId) {
      try { await deleteAttachment(source.attachmentId); } catch { /* state removal remains possible */ }
    }
    updateState("pilot_source_removed", (current) => {
      const next = invalidateDerivedPilotState(current);
      return { ...next, sources: current.sources.filter((item) => item.id !== source.id) };
    }, { sourceKind: source.kind, priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) });
  }

  function updateSourceStatus(id: string, next: SourceStatus) {
    updateState("pilot_source_status_changed", (current) => {
      const invalidated = invalidateDerivedPilotState(current);
      return { ...invalidated, sources: current.sources.map((source) => source.id === id ? { ...source, status: next } : source) };
    }, { sourceStatus: next, priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) });
  }

  const validCount = state.sources.filter((source) => source.status === "included" || source.status === "redacted").length;
  return (
    <StepFrame title={pt(pilotCopy.intakeTitle, language)} body={pt(pilotCopy.intakeBody, language)} time={pt(pilotCopy.intakeTime, language)} next={pt(pilotCopy.intakeNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-4xl space-y-6">
        <StatusMessage tone="neutral"><span className="flex items-start gap-2"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" /> {pt(pilotCopy.localOnly, language)}</span></StatusMessage>
        {state.submission.packetPreparedAt ? <StatusMessage tone="warning">{pt(pilotCopy.intakeRevisionWarning, language)}</StatusMessage> : null}
        <StatusMessage tone="neutral">{pt(pilotCopy.linkReferenceBoundary, language)}</StatusMessage>
        <UCard padding="lg">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setMode("text")} aria-pressed={mode === "text"} className="rounded-full border border-border px-4 py-2 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">{pt(pilotCopy.addText, language)}</button>
            <button type="button" onClick={() => setMode("link")} aria-pressed={mode === "link"} className="rounded-full border border-border px-4 py-2 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">{pt(pilotCopy.addLink, language)}</button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary"><Upload className="me-2 inline size-4" />{pt(pilotCopy.addFiles, language)}</button>
            <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} className="sr-only" onChange={addFiles} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{pt(pilotCopy.attachmentLimit, language)}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {mode === "text" ? (
              <label className="block"><span className="text-sm font-semibold">{pt(pilotCopy.sourceType, language)}</span><select value={kind} onChange={(event) => setKind(event.target.value as SourceKind)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring">{(Object.keys(sourceKindLabels) as SourceKind[]).filter((item) => item !== "link").map((item) => <option key={item} value={item}>{pt(sourceKindLabels[item], language)}</option>)}</select></label>
            ) : null}
            <label className="block"><span className="text-sm font-semibold">{pt(pilotCopy.sourceLabel, language)}</span><input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="block"><span className="text-sm font-semibold">{pt(pilotCopy.sourceDate, language)}</span><input value={sourceDate} onChange={(event) => setSourceDate(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" placeholder={pt(pilotCopy.sourceDateExample, language)} /></label>
            <label className="block"><span className="text-sm font-semibold">{pt(pilotCopy.sourceStatus, language)}</span><select value={status} onChange={(event) => setStatus(event.target.value as SourceStatus)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring">{(Object.keys(sourceStatusLabels) as SourceStatus[]).map((item) => <option key={item} value={item}>{pt(sourceStatusLabels[item], language)}</option>)}</select></label>
            {mode === "text" ? <label className="block sm:col-span-2"><span className="text-sm font-semibold">{pt(pilotCopy.sourceText, language)}</span><textarea rows={5} maxLength={MAX_TEXT_PER_SOURCE} value={text} onChange={(event) => setText(event.target.value)} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /><span className="mt-1 block text-end text-[0.68rem] text-muted-foreground">{text.length.toLocaleString()} / {MAX_TEXT_PER_SOURCE.toLocaleString()}</span></label> : <label className="block sm:col-span-2"><span className="text-sm font-semibold">{pt(pilotCopy.sourceLink, language)}</span><input type="url" value={link} onChange={(event) => setLink(event.target.value)} className="mt-2 h-12 w-full rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-ring" /></label>}
          </div>
          <UButton className="mt-5" variant="outline" onClick={addTextSource} disabled={busy}><Plus /> {pt(pilotCopy.addSource, language)}</UButton>
        </UCard>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{pt(pilotCopy.materialAdded, language)} ({state.sources.length})</h2><span className="text-xs text-muted-foreground">{pt(pilotCopy.textUsage, language)}: {totalTextChars.toLocaleString()} / {MAX_TOTAL_TEXT.toLocaleString()} · {pt(pilotCopy.filesUsage, language)}: {formatBytes(totalFileBytes)} / 12 MB</span></div>
          {state.sources.length ? (
            <ul className="mt-4 space-y-3">
              {state.sources.map((source) => (
                <li key={source.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">{source.kind === "link" ? <Link2 className="size-4" /> : source.kind === "message" || source.kind === "email" ? <MessageSquareText className="size-4" /> : <FileText className="size-4" />}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{source.label}</p><p className="mt-1 text-xs text-muted-foreground">{pt(sourceKindLabels[source.kind], language)} · {source.sourceDate || pt(pilotCopy.timeNotSupplied, language)}{source.fileSize ? ` · ${formatBytes(source.fileSize)}` : ""}</p>{source.text ? <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{source.text}</p> : null}<p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">SHA-256 {source.sha256.slice(0, 12)}…</p></div>
                    <select aria-label={`${pt(pilotCopy.sourceStatus, language)}: ${source.label}`} value={source.status} onChange={(event) => updateSourceStatus(source.id, event.target.value as SourceStatus)} className="h-9 rounded-xl border border-input bg-background px-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring">{(Object.keys(sourceStatusLabels) as SourceStatus[]).map((item) => <option key={item} value={item}>{pt(sourceStatusLabels[item], language)}</option>)}</select>
                    <UButton variant="ghost" size="icon" onClick={() => removeSource(source)} aria-label={`${pt(pilotCopy.remove, language)} ${source.label}`}><Trash2 /></UButton>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="mt-4 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{pt(pilotCopy.noMaterial, language)}</div>}
          <p className={cn("mt-3 text-sm", validCount >= 2 ? "text-confirmed-foreground" : "text-openloop-foreground")}>{validCount >= 2 ? `✓ ${validCount} ${pt(pilotCopy.usableSources, language)}` : pt(pilotCopy.sourceMinimum, language)}</p>
        </div>

        <fieldset className="space-y-3"><legend className="mb-3 text-base font-semibold">{pt(pilotCopy.beforeExport, language)}</legend>
          <PilotCheckbox checked={state.consent.permissionConfirmed} onChange={(value) => updateState("pilot_consent_updated", (current) => { const next = invalidateDerivedPilotState(current); return { ...next, consent: { ...current.consent, permissionConfirmed: value, confirmedAt: null } }; }, { priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) })}>{pt(pilotCopy.permissionConsent, language)}</PilotCheckbox>
          <PilotCheckbox checked={state.consent.redactionConfirmed} onChange={(value) => updateState("pilot_consent_updated", (current) => { const next = invalidateDerivedPilotState(current); return { ...next, consent: { ...current.consent, redactionConfirmed: value, confirmedAt: null } }; }, { priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) })}>{pt(pilotCopy.redactionConsent, language)}</PilotCheckbox>
          <PilotCheckbox checked={state.consent.localBoundaryConfirmed} onChange={(value) => updateState("pilot_consent_updated", (current) => { const next = invalidateDerivedPilotState(current); return { ...next, consent: { ...current.consent, localBoundaryConfirmed: value, confirmedAt: null } }; }, { priorPacketInvalidated: Boolean(state.submission.packetPreparedAt) })}>{pt(pilotCopy.boundaryConsent, language)}</PilotCheckbox>
        </fieldset>
        <StatusMessage tone="neutral">{language === "ar" ? "تم تثبيت خط الأساس قبل إضافة المواد. للحفاظ على صلاحية القياس، ابدأ تجربة جديدة إذا كان خط الأساس غير صحيح." : "The baseline was locked before material was added. To preserve measurement validity, start a new pilot if the baseline is wrong."}</StatusMessage>
        <div className="flex flex-wrap gap-3"><UButton onClick={onPrepare} disabled={!isIntakeValid(state) || busy}><Download /> {pt(pilotCopy.preparePacket, language)}</UButton></div>
      </div>
    </StepFrame>
  );
}

function ProcessingStep({ state, language, utilityCard, busy, onDownloadAgain, onMarkSent, onImport, onBack }: { state: PilotState; language: Language; utilityCard: ReactNode; busy: boolean; onDownloadAgain: () => void; onMarkSent: () => void; onImport: (file: File) => void; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const sent = Boolean(state.submission.packetSentAt);
  const mailSubject = language === "ar"
    ? `تجربة أولوميس ${state.pilotId.slice(0, 8)} — ديفيد`
    : `Ulomis pilot ${state.pilotId.slice(0, 8)} — David`;
  const mailBody = language === "ar"
    ? `مرحبًا سليمة،\n\nأكملت إدخال تجربة أولوميس للخيط: ${state.qualification.threadLabel}. سأرفق ${state.submission.packetFileName ?? "حزمة التجربة التي تم تنزيلها"} بهذه الرسالة.\n\nمعرّف التجربة: ${state.pilotId}\n\nيرجى إعادة ملف JSON للاستمرارية بعد إعداده للمراجعة.\n`
    : `Hi Salima,\n\nI have completed the Ulomis pilot intake for ${state.qualification.threadLabel}. I will attach ${state.submission.packetFileName ?? "the downloaded pilot packet"} to this email.\n\nPilot ID: ${state.pilotId}\n\nPlease return the prepared continuity JSON file for review.\n`;
  const mailHref = `mailto:${PILOT_EMAIL}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
  return (
    <StepFrame title={pt(pilotCopy.processingTitle, language)} body={pt(pilotCopy.processingBody, language)} time={pt(pilotCopy.processingTime, language)} next={pt(pilotCopy.processingNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-3xl space-y-5">
        <ol className="space-y-3">
          <ProcessRow done title={pt(pilotCopy.packetPrepared, language)} detail={state.submission.packetFileName ?? pt(pilotCopy.packetDownloaded, language)} />
          <ProcessRow done={sent} title={pt(pilotCopy.sendPacket, language)} detail={sent ? `${pt(pilotCopy.sent, language)} · ${formatDate(state.submission.packetSentAt!, language)}` : pt(pilotCopy.attachPacketDetail, language)} />
          <ProcessRow
            done={false}
            active={sent}
            title={pt(pilotCopy.reconstruction, language)}
            detail={sent
              ? `${pt(pilotCopy.noAction, language)} ${pt(pilotCopy.preparationDeadline, language)}: ${formatDate(state.submission.targetDeliveryAt ?? "", language)}. ${pt(pilotCopy.deadlineCommitment, language)}`
              : (language === "ar" ? "يبدأ هذا بعد إرسال الحزمة." : "This begins after you send the packet.")}
          />
          <ProcessRow done={false} title={pt(pilotCopy.importContinuity, language)} detail={language === "ar" ? "استورد فقط ملف JSON للاستمرارية الذي تعيده مسؤولة التجربة." : "Import only the JSON continuity file returned by the pilot operator."} />
        </ol>
        <div className="rounded-3xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold">{pt(pilotCopy.transferDeliberately, language)}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pt(pilotCopy.transferDeliberatelyBody, language)}</p>
          <p className="mt-3 font-mono text-xs text-foreground">{PILOT_EMAIL}</p>
          <div className="mt-4 flex flex-wrap gap-2"><UButton variant="outline" onClick={onDownloadAgain} disabled={busy}><Download /> {pt(pilotCopy.downloadAgain, language)}</UButton><UButton asChild><a href={mailHref}><Mail /> {pt(pilotCopy.openEmail, language)}</a></UButton><UButton variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(PILOT_EMAIL); toast.success(language === "ar" ? "تم نسخ عنوان البريد." : "Email address copied."); } catch { toast.error(language === "ar" ? "تعذر النسخ. استخدم العنوان الظاهر." : "Copy failed. Use the address shown."); } }}><Copy /> {language === "ar" ? "انسخ العنوان" : "Copy address"}</UButton></div>
          {!sent ? <UButton className="mt-3" variant="quiet" onClick={onMarkSent}><Send /> {pt(pilotCopy.markSent, language)}</UButton> : null}
        </div>
        <StatusMessage tone="warning"><strong>{pt(pilotCopy.transferBoundaryLabel, language)}:</strong> {pt(pilotCopy.emailBoundary, language)}</StatusMessage>
        <div className="rounded-3xl border border-primary/25 bg-primary/5 p-5">
          <h2 className="text-base font-semibold">{pt(pilotCopy.continuityReady, language)}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pt(pilotCopy.continuityReadyBody, language)}</p>
          <UButton className="mt-4" onClick={() => fileRef.current?.click()} disabled={!sent}><Upload /> {pt(pilotCopy.importFile, language)}</UButton>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" disabled={!sent} onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ""; }} />
        </div>
        <div className="flex flex-wrap gap-3"><UButton variant="ghost" onClick={onBack}><BackArrow language={language} /> {pt(pilotCopy.back, language)}</UButton></div>
      </div>
    </StepFrame>
  );
}

function ProcessRow({ done, active = false, title, detail }: { done: boolean; active?: boolean; title: string; detail: string }) {
  return (
    <li className={cn("flex gap-4 rounded-2xl border p-4", done ? "border-confirmed/35 bg-confirmed/8" : active ? "border-primary/35 bg-primary/5" : "border-border bg-surface")}>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", done ? "bg-confirmed text-confirmed-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : <PauseCircle className="size-4" />}</span>
      <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p></div>
    </li>
  );
}

function ReviewStep({ state, language, utilityCard, confirmAccuracy, setConfirmAccuracy, onCorrection, onOpenAttachment, onBack, onConfirm }: { state: PilotState; language: Language; utilityCard: ReactNode; confirmAccuracy: boolean; setConfirmAccuracy: (value: boolean) => void; onCorrection: (correction: ClaimCorrection) => void; onOpenAttachment: (source: PilotSource) => void | Promise<void>; onBack: () => void; onConfirm: () => void }) {
  const materialCorrections = state.corrections.filter((item) => item.choice !== "correct");
  const effectiveAction = getEffectiveNextAction(state);
  return (
    <StepFrame title={pt(pilotCopy.reviewTitle, language)} body={pt(pilotCopy.reviewBody, language)} time={pt(pilotCopy.reviewTime, language)} next={pt(pilotCopy.reviewNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-4xl space-y-6">
        <StatusMessage tone="warning"><strong>{pt(pilotCopy.draft, language)}.</strong> {state.continuity?.operatorMessage || pt(pilotCopy.draftUnconfirmedBody, language)}</StatusMessage>
        {state.continuity ? <PilotContinuityView continuity={state.continuity} language={language} sources={state.sources} corrections={state.corrections} reviewMode onCorrection={onCorrection} onOpenAttachment={onOpenAttachment} /> : null}
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{pt(pilotCopy.effectiveAction, language)}</p>
          <p className="mt-3 text-lg font-semibold leading-7">{effectiveAction}</p>
          <p className="mt-2 text-sm text-muted-foreground">{pt(pilotCopy.suggestionBoundary, language)}</p>
          <p className="mt-4 text-xs text-muted-foreground">{pt(pilotCopy.materialCorrections, language)}: {materialCorrections.length}</p>
        </div>
        <PilotCheckbox checked={confirmAccuracy} onChange={setConfirmAccuracy}>{pt(pilotCopy.confirmAccuracy, language)}</PilotCheckbox>
        <div className="flex flex-wrap gap-3"><UButton variant="ghost" onClick={onBack}><BackArrow language={language} /> {pt(pilotCopy.back, language)}</UButton><UButton onClick={onConfirm} disabled={!confirmAccuracy}><ClipboardCheck /> {pt(pilotCopy.confirmThread, language)}</UButton></div>
      </div>
    </StepFrame>
  );
}

function AwaitingReentryStep({ state, language, utilityCard, onStart, onCopyLink, onExportRecovery }: { state: PilotState; language: Language; utilityCard: ReactNode; onStart: () => void; onCopyLink: () => void; onExportRecovery: () => void }) {
  const earlyReturn = isBeforeExpectedReturn(state.qualification.expectedReturnDate);
  return (
    <StepFrame title={pt(pilotCopy.awaitingTitle, language)} body={pt(pilotCopy.awaitingBody, language)} time={pt(pilotCopy.noWorkUntilReturn, language)} next={pt(pilotCopy.returnInstructions, language)} language={language} aside={utilityCard}>
      <div className="max-w-3xl space-y-6">
        <UCard variant="thread" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{pt(pilotCopy.returnTarget, language)}</p><p className="mt-2 text-xl font-semibold">{formatDate(state.qualification.expectedReturnDate, language)}</p></div><span className="rounded-full bg-confirmed/12 px-3 py-1 text-xs font-bold text-confirmed-foreground">{pt(pilotCopy.confirmedAt, language)} {formatDate(state.confirmation.confirmedAt ?? "", language)}</span></div>
          <div className="mt-6 rounded-2xl bg-muted/40 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{pt(pilotCopy.preserved, language)}</p><p className="mt-2 text-sm font-semibold">{state.qualification.threadLabel}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{language === "ar" ? "الحالة التشغيلية المؤكدة مختومة حتى تبدأ اختبار العودة." : "The confirmed operational state is sealed until you start the re-entry test."}</p></div>
        </UCard>
        <StatusMessage tone="neutral"><strong>{pt(pilotCopy.returnProtocol, language)}:</strong> {pt(pilotCopy.returnInstructions, language)}</StatusMessage>
        <div className="flex flex-wrap gap-3"><UButton variant="outline" onClick={onCopyLink}><Copy /> {pt(pilotCopy.copyLink, language)}</UButton><UButton variant="outline" onClick={onExportRecovery}><Download /> {pt(pilotCopy.exportRecovery, language)}</UButton></div>
        <StatusMessage tone="warning">{pt(pilotCopy.sameDeviceBoundary, language)}</StatusMessage>
        {earlyReturn ? <StatusMessage tone="warning">{pt(pilotCopy.earlyReturnWarning, language)}</StatusMessage> : null}
        <div className="rounded-3xl border border-primary/25 bg-primary/5 p-5"><p className="text-sm font-semibold">{pt(pilotCopy.startOnlyOnReturn, language)}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{pt(pilotCopy.timerBoundary, language)}</p><UButton className="mt-4" size="lg" onClick={onStart}><Timer /> {pt(pilotCopy.returningNow, language)}</UButton></div>
      </div>
    </StepFrame>
  );
}

function ReentryStep({ state, language, utilityCard, elapsedSeconds, updateCounter, onOpenAttachment, onSourceReferenceOpened, onReady }: { state: PilotState; language: Language; utilityCard: ReactNode; elapsedSeconds: number; updateCounter: (key: "otherSourcesReopened" | "peopleContacted", delta: number) => void; onOpenAttachment: (source: PilotSource) => void | Promise<void>; onSourceReferenceOpened: (source: PilotSource) => void; onReady: () => void }) {
  return (
    <StepFrame title={pt(pilotCopy.reentryTitle, language)} body={pt(pilotCopy.reentryBody, language)} time={pt(pilotCopy.reentryTime, language)} next={pt(pilotCopy.reentryNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-4xl space-y-6">
        <div className="sticky top-28 z-30 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-primary/30 bg-surface/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Timer className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{pt(pilotCopy.elapsed, language)}</p><p className="font-mono text-2xl font-bold tabular-nums">{formatTimer(elapsedSeconds)}</p></div></div>
          <UButton size="lg" onClick={onReady}><CheckCircle2 /> {pt(pilotCopy.readyToAct, language)}</UButton>
        </div>
        {state.continuity ? <PilotContinuityView continuity={state.continuity} language={language} sources={state.sources} corrections={state.corrections} title={pt(pilotCopy.whereLeft, language)} onOpenAttachment={onOpenAttachment} onSourceReferenceOpened={onSourceReferenceOpened} /> : null}
        <StatusMessage tone="neutral">{pt(pilotCopy.sourceCountingHelp, language)}</StatusMessage>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm font-semibold">{pt(pilotCopy.sourcesOpenedFromEvidence, language)}</p><p className="mt-4 text-2xl font-bold tabular-nums">{state.reentry.sourceIdsOpenedFromUlomis.length}</p></div>
          <CounterCard label={pt(pilotCopy.otherSourcesOpened, language)} value={state.reentry.otherSourcesReopened} onChange={(delta) => updateCounter("otherSourcesReopened", delta)} />
          <CounterCard label={pt(pilotCopy.personContacted, language)} value={state.reentry.peopleContacted} onChange={(delta) => updateCounter("peopleContacted", delta)} />
        </div>
      </div>
    </StepFrame>
  );
}

function CounterCard({ label, value, onChange }: { label: string; value: number; onChange: (delta: number) => void }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-5"><p className="text-sm font-semibold">{label}</p><div className="mt-4 flex items-center gap-3"><UButton variant="outline" size="icon" onClick={() => onChange(-1)} disabled={value === 0}><Minus /></UButton><span className="min-w-10 text-center text-2xl font-bold tabular-nums">{value}</span><UButton variant="outline" size="icon" onClick={() => onChange(1)}><Plus /></UButton></div></div>
  );
}

function ResultStep({ state, language, utilityCard, update, setDecision, onFinalize, onExportOutcome, onExportArchive }: { state: PilotState; language: Language; utilityCard: ReactNode; update: (reentry: PilotState["reentry"]) => void; setDecision: (decision: PilotDecision) => void; onFinalize: () => void; onExportOutcome: () => void; onExportArchive: () => void }) {
  const r = state.reentry;
  const set = <K extends keyof typeof r>(key: K, value: (typeof r)[K]) => update({ ...r, [key]: value });
  const report = buildOutcomeReport(state);
  const delta = report.measured.reentryMinutesDelta;
  const adminDelta = report.measured.adminMinutesDelta;
  const finalized = Boolean(state.result.finalizedAt);
  const outcomeSubject = language === "ar"
    ? `نتيجة تجربة أولوميس ${state.pilotId.slice(0, 8)} — ديفيد`
    : `Ulomis pilot outcome ${state.pilotId.slice(0, 8)} — David`;
  const outcomeBody = language === "ar"
    ? `معرّف التجربة: ${state.pilotId}\nالخيط: ${state.qualification.threadLabel}\nخط الأساس للعودة: ${report.measured.baselineReentryMinutes} دقيقة\nالعودة المرصودة: ${report.measured.actualReentryMinutes.toFixed(1)} دقيقة\nخط أساس الإدارة / الفعلي: ${report.measured.baselineAdminMinutes.toFixed(1)} / ${report.measured.actualAdminMinutes.toFixed(1)} دقيقة\nالمصادر التي تُفتح عادة / التي أُعيد فتحها: ${report.measured.baselineSources} / ${report.measured.sourcesReopened}\nالأشخاص الذين يتم التواصل معهم عادة / الذين تم التواصل معهم: ${report.measured.baselinePeople} / ${report.measured.peopleContacted}\nالقرار: ${state.result.decision ?? "لم يُحدّد"}\n\nسأرفق تقرير النتيجة الذي تم تنزيله.`
    : `Pilot ID: ${state.pilotId}\nThread: ${state.qualification.threadLabel}\nBaseline re-entry: ${report.measured.baselineReentryMinutes} minutes\nObserved re-entry: ${report.measured.actualReentryMinutes.toFixed(1)} minutes\nAdmin baseline / actual: ${report.measured.baselineAdminMinutes.toFixed(1)} / ${report.measured.actualAdminMinutes.toFixed(1)} minutes\nSources normally opened / reopened: ${report.measured.baselineSources} / ${report.measured.sourcesReopened}\nPeople normally contacted / contacted: ${report.measured.baselinePeople} / ${report.measured.peopleContacted}\nDecision: ${state.result.decision ?? "not selected"}\n\nI will attach the downloaded outcome report.`;
  const emailHref = `mailto:${PILOT_EMAIL}?subject=${encodeURIComponent(outcomeSubject)}&body=${encodeURIComponent(outcomeBody)}`;
  return (
    <StepFrame title={pt(pilotCopy.resultTitle, language)} body={pt(pilotCopy.resultBody, language)} time={pt(pilotCopy.resultTime, language)} next={pt(pilotCopy.resultNext, language)} language={language} aside={utilityCard}>
      <div className="max-w-4xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label={delta > 0 ? pt(pilotCopy.minutesSaved, language) : delta < 0 ? pt(pilotCopy.minutesLonger, language) : pt(pilotCopy.noSaving, language)}
            value={Math.abs(delta).toFixed(1)}
            context={`${report.measured.baselineReentryMinutes.toFixed(1)} ${pt(pilotCopy.selfReportedBaseline, language)} → ${report.measured.actualReentryMinutes.toFixed(1)} ${pt(pilotCopy.observed, language)}`}
            good={delta > 0}
          />
          <MetricCard
            label={adminDelta > 0 ? pt(pilotCopy.adminMinutesSaved, language) : adminDelta < 0 ? pt(pilotCopy.adminMinutesLonger, language) : pt(pilotCopy.noAdminSaving, language)}
            value={Math.abs(adminDelta).toFixed(1)}
            context={`${report.measured.baselineAdminMinutes.toFixed(1)} ${pt(pilotCopy.selfReportedBaseline, language)} → ${report.measured.actualAdminMinutes.toFixed(1)} ${pt(pilotCopy.observed, language)}`}
            good={adminDelta > 0}
          />
          <MetricCard
            label={report.measured.sourcesDelta > 0 ? pt(pilotCopy.sourcesAvoided, language) : report.measured.sourcesDelta < 0 ? pt(pilotCopy.additionalSources, language) : pt(pilotCopy.noSourceReduction, language)}
            value={String(Math.abs(report.measured.sourcesDelta))}
            context={`${report.measured.baselineSources} ${pt(pilotCopy.selfReportedBaseline, language)} → ${report.measured.sourcesReopened} ${pt(pilotCopy.reopened, language)}`}
            good={report.measured.sourcesDelta > 0}
          />
          <MetricCard
            label={report.measured.peopleDelta > 0 ? pt(pilotCopy.contactsAvoided, language) : report.measured.peopleDelta < 0 ? pt(pilotCopy.additionalContacts, language) : pt(pilotCopy.noContactReduction, language)}
            value={String(Math.abs(report.measured.peopleDelta))}
            context={`${report.measured.baselinePeople} ${pt(pilotCopy.selfReportedBaseline, language)} → ${report.measured.peopleContacted} ${pt(pilotCopy.contacted, language)}`}
            good={report.measured.peopleDelta > 0}
          />
        </div>
        <StatusMessage tone={report.interruption.earlyReturnConfirmed ? "warning" : "neutral"}>
          <strong>{pt(pilotCopy.interruptionObserved, language)}:</strong> {formatDurationMinutes(report.interruption.observedMinutes, language)}. {report.interruption.earlyReturnConfirmed ? pt(pilotCopy.earlyEvidenceBoundary, language) : ""}
        </StatusMessage>
        <StatusMessage tone={delta > 0 ? "good" : "warning"}><strong>{pt(pilotCopy.observedResult, language)}.</strong> {pt(pilotCopy.resultCalculationBoundary, language)}</StatusMessage>
        <StatusMessage tone="neutral">{pt(pilotCopy.actualAdminHelp, language)}</StatusMessage>
        <UCard padding="lg">
          <div className="grid gap-6 sm:grid-cols-2">
            <NumberField label={pt(pilotCopy.actualAdminMinutes, language)} value={r.actualAdminMinutes} onChange={(value) => set("actualAdminMinutes", value)} min={0} max={Math.max(0.1, Math.ceil(report.measured.actualReentryMinutes * 10) / 10)} step={0.1} suffix={pt(pilotCopy.minutes, language)} disabled={finalized} />
            <NumberField label={pt(pilotCopy.correctionsOnReturn, language)} value={r.correctionsRequiredOnReturn} onChange={(value) => set("correctionsRequiredOnReturn", value ?? 0)} min={0} max={50} disabled={finalized} />
            <NumberField label={pt(pilotCopy.coordinationAvoided, language)} value={r.coordinationStepsAvoided} onChange={(value) => set("coordinationStepsAvoided", value)} min={0} max={50} disabled={finalized} />
            <OutcomeChoice label={pt(pilotCopy.actionTaken, language)} value={r.nextActionTaken} onChange={(value) => set("nextActionTaken", value)} language={language} disabled={finalized} />
            <OutcomeChoice label={pt(pilotCopy.duplicatedAvoided, language)} value={r.duplicatedWorkAvoided} onChange={(value) => set("duplicatedWorkAvoided", value)} language={language} disabled={finalized} />
            <OutcomeChoice label={pt(pilotCopy.followupsAvoided, language)} value={r.followupsAvoided} onChange={(value) => set("followupsAvoided", value)} language={language} disabled={finalized} />
            <div />
            <ConfidenceField label={`${pt(pilotCopy.stateConfidence, language)} — ${pt(pilotCopy.afterReentry, language)}`} value={r.stateConfidenceAfter} onChange={(value) => set("stateConfidenceAfter", value)} language={language} disabled={finalized} />
            <ConfidenceField label={`${pt(pilotCopy.actionConfidence, language)} — ${pt(pilotCopy.afterReentry, language)}`} value={r.nextActionConfidenceAfter} onChange={(value) => set("nextActionConfidenceAfter", value)} language={language} disabled={finalized} />
            <label className="block sm:col-span-2"><span className="text-sm font-semibold">{pt(pilotCopy.resultNotes, language)}</span><textarea rows={3} value={r.notes} onChange={(event) => set("notes", event.target.value)} disabled={finalized} className="mt-2 w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60" /></label>
          </div>
        </UCard>
        <fieldset><legend className="text-lg font-semibold">{pt(pilotCopy.decisionTitle, language)}</legend><div className="mt-4 grid gap-3">
          {([
            ["second_thread", pilotCopy.secondThread],
            ["revise_repeat", pilotCopy.reviseRepeat],
            ["stop", pilotCopy.stop],
          ] as const).map(([decision, label]) => (
            <button type="button" key={decision} onClick={() => setDecision(decision)} disabled={finalized} aria-pressed={state.result.decision === decision} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 text-start outline-none transition-colors aria-pressed:border-primary aria-pressed:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"><span className="text-sm font-semibold">{pt(label, language)}</span><ChevronRight className="size-4 text-muted-foreground" /></button>
          ))}
        </div></fieldset>
        <StatusMessage tone="neutral">{pt(pilotCopy.singleThreadBoundary, language)}</StatusMessage>
        {!finalized ? <UButton size="lg" onClick={onFinalize} disabled={!isOutcomeValid(state)}><ClipboardCheck /> {pt(pilotCopy.finalize, language)}</UButton> : (
          <div className="rounded-3xl border border-confirmed/35 bg-confirmed/10 p-5"><p className="flex items-center gap-2 font-semibold text-confirmed-foreground"><CheckCircle2 className="size-5" /> {pt(pilotCopy.finalized, language)}</p><p className="mt-2 text-sm text-muted-foreground">{pt(pilotCopy.finalized, language)} {formatDate(state.result.finalizedAt!, language)}. {pt(pilotCopy.finalizedDetail, language)}</p><div className="mt-4 flex flex-wrap gap-2"><UButton variant="outline" onClick={onExportOutcome}><Download /> {pt(pilotCopy.exportOutcome, language)}</UButton><UButton variant="outline" onClick={onExportArchive}><FileArchive /> {pt(pilotCopy.exportArchive, language)}</UButton><UButton asChild><a href={emailHref}><Mail /> {pt(pilotCopy.emailOutcome, language)}</a></UButton></div></div>
        )}
      </div>
    </StepFrame>
  );
}

function MetricCard({ label, value, context, good }: { label: string; value: string; context: string; good: boolean }) {
  return <div className={cn("rounded-3xl border bg-surface p-5", good ? "border-confirmed/35" : "border-border")}><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={cn("mt-3 text-3xl font-bold", good && "text-confirmed-foreground")}>{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{context}</p></div>;
}
