import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  ExternalLink,
  FileText,
  History,
  Link2,
  PencilLine,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Language } from "../journey-data";
import { UButton } from "../Button";
import { claimLabels, pilotCopy, pt } from "./pilot-copy";
import {
  claimFieldOrder,
  effectiveClaimValue,
  type ClaimClassification,
  type ClaimCorrection,
  type ContinuityClaim,
  type CorrectionChoice,
  type PilotSource,
  type PreparedContinuity,
  type SourceKind,
  type SourceStatus,
} from "./pilot-types";
import { cn } from "@/lib/utils";

const classificationLabels: Record<ClaimClassification, { en: string; ar: string }> = {
  source_fact: { en: "Source-backed fact", ar: "حقيقة مدعومة بمصدر" },
  user_statement: { en: "Your stated meaning", ar: "المعنى الذي ذكرته" },
  inference: { en: "Inference", ar: "استنتاج" },
  suggestion: { en: "Suggestion", ar: "اقتراح" },
  contradiction: { en: "Contradiction", ar: "تعارض" },
};

const correctionLabels: Record<CorrectionChoice, { en: string; ar: string }> = {
  correct: { en: "Correct", ar: "صحيح" },
  partial: { en: "Partly right", ar: "صحيح جزئيًا" },
  outdated: { en: "Outdated", ar: "قديم" },
  unrelated: { en: "Unrelated", ar: "غير مرتبط" },
  missing: { en: "Something is missing", ar: "هناك شيء مفقود" },
};

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

function badgeClass(classification: ClaimClassification) {
  if (classification === "source_fact") return "border-confirmed/35 bg-confirmed/12 text-confirmed-foreground";
  if (classification === "inference") return "border-openloop/45 bg-openloop/12 text-openloop-foreground";
  if (classification === "contradiction") return "border-correction/45 bg-correction/12 text-correction-foreground";
  if (classification === "suggestion") return "border-primary/35 bg-primary/8 text-primary";
  return "border-border bg-muted/60 text-foreground";
}

function ClaimCard({
  claim,
  language,
  sources,
  corrections,
  onCorrection,
  onOpenAttachment,
  onSourceReferenceOpened,
  reviewMode,
}: {
  claim: ContinuityClaim;
  language: Language;
  sources: PilotSource[];
  corrections: ClaimCorrection[];
  onCorrection?: (correction: ClaimCorrection) => void;
  onOpenAttachment?: (source: PilotSource) => void | Promise<void>;
  onSourceReferenceOpened?: (source: PilotSource) => void;
  reviewMode: boolean;
}) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState<CorrectionChoice>("partial");
  const [correctedValue, setCorrectedValue] = useState("");
  const [reason, setReason] = useState("");
  const [revisedNextAction, setRevisedNextAction] = useState("");
  const effective = effectiveClaimValue(claim, corrections);
  const latestCorrection = [...corrections].reverse().find((item) => item.claimId === claim.id);
  const claimSources = sources.filter((source) => claim.sourceIds.includes(source.id));

  function apply() {
    if (!onCorrection) return;
    onCorrection({
      claimId: claim.id,
      choice,
      correctedValue,
      reason,
      revisedNextAction,
      createdAt: new Date().toISOString(),
    });
    setEditing(false);
    setCorrectedValue("");
    setReason("");
    setRevisedNextAction("");
  }

  return (
    <article className={cn("rounded-3xl border bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6", effective.status !== "original" && "border-primary/35")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{pt(claimLabels[claim.field], language)}</p>
          {effective.status === "removed" ? (
            <p className="mt-3 text-sm italic text-muted-foreground line-through">{claim.value}</p>
          ) : (
            <p className="mt-3 whitespace-pre-line text-base font-medium leading-7">{effective.value}</p>
          )}
        </div>
        <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-bold", badgeClass(claim.classification))}>
          {claim.classification === "contradiction" ? <AlertTriangle className="size-3" /> : claim.classification === "inference" ? <CircleHelp className="size-3" /> : <ShieldCheck className="size-3" />}
          {pt(classificationLabels[claim.classification], language)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2.5 py-1">{pt(pilotCopy.confidence, language)}: {Math.round(claim.confidence * 100)}%</span>
        <span className="rounded-full bg-muted px-2.5 py-1">{pt(pilotCopy.lastConfirmed, language)}: {claim.lastConfirmed || "—"}</span>
        <span className="rounded-full bg-muted px-2.5 py-1">{claimSources.length} {pt(pilotCopy.sources, language).toLowerCase()}</span>
      </div>

      <button
        type="button"
        onClick={() => setEvidenceOpen((value) => !value)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={evidenceOpen}
      >
        <ChevronDown className={cn("size-4 transition-transform", evidenceOpen && "rotate-180")} />
        {pt(pilotCopy.whyShown, language)}
      </button>

      {evidenceOpen ? (
        <div className="mt-3 rounded-2xl border border-border bg-muted/35 p-4">
          {claimSources.length ? (
            <ul className="space-y-3">
              {claimSources.map((source) => (
                <li key={source.id} className="flex gap-3">
                  {source.kind === "link" ? <Link2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <FileText className="mt-0.5 size-4 shrink-0 text-primary" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{source.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{pt(sourceKindLabels[source.kind], language)} · {source.sourceDate || pt(pilotCopy.timeNotSupplied, language)} · {pt(sourceStatusLabels[source.status], language)}</p>
                    {source.text ? <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{source.text}</p> : null}
                    {source.link ? (
                      <a href={source.link} target="_blank" rel="noreferrer" onClick={() => onSourceReferenceOpened?.(source)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline">
                        {pt(pilotCopy.openReference, language)} <ExternalLink className="size-3" />
                      </a>
                    ) : null}
                    {source.attachmentId && onOpenAttachment ? (
                      <button type="button" onClick={() => onOpenAttachment(source)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring">
                        {pt(pilotCopy.openLocalAttachment, language)} <Download className="size-3" />
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{pt(pilotCopy.sourceFallback, language)}</p>
          )}
          {latestCorrection ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground"><History className="size-3.5" /> {pt(pilotCopy.correctionRecord, language)}</p>
              <p className="mt-2 text-sm">{pt(correctionLabels[latestCorrection.choice], language)}{latestCorrection.reason ? ` — ${latestCorrection.reason}` : ""}</p>
              {latestCorrection.correctedValue ? <p className="mt-1 text-sm text-muted-foreground">{pt(pilotCopy.updatedTo, language)}: {latestCorrection.correctedValue}</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {reviewMode ? (
        <div className="mt-5 border-t border-border pt-4">
          {!editing ? (
            <div className="flex flex-wrap gap-2">
              <UButton
                size="sm"
                variant={latestCorrection?.choice === "correct" ? "primary" : "outline"}
                onClick={() => onCorrection?.({ claimId: claim.id, choice: "correct", correctedValue: "", reason: "", revisedNextAction: "", createdAt: new Date().toISOString() })}
              >
                <Check /> {pt(pilotCopy.looksRight, language)}
              </UButton>
              <UButton size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <PencilLine /> {pt(pilotCopy.correctItem, language)}
              </UButton>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-correction/25 bg-correction/5 p-4">
              <fieldset>
                <legend className="text-sm font-semibold">{pt(pilotCopy.correctItem, language)}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(correctionLabels) as CorrectionChoice[]).map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => setChoice(option)}
                      aria-pressed={choice === option}
                      className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold outline-none transition-colors aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {pt(correctionLabels[option], language)}
                    </button>
                  ))}
                </div>
              </fieldset>
              {choice !== "correct" ? (
                <label className="block text-sm font-semibold">
                  {pt(pilotCopy.correctedText, language)}
                  <textarea
                    value={correctedValue}
                    onChange={(event) => setCorrectedValue(event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-ring"
                    placeholder={choice === "outdated" || choice === "unrelated" ? pt(pilotCopy.correctionRemoveHint, language) : pt(pilotCopy.correctionWriteHint, language)}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-semibold">
                {pt(pilotCopy.correctionReason, language)} <span className="font-normal text-muted-foreground">({pt(pilotCopy.optional, language)})</span>
                <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
              </label>
              {claim.field !== "nextAction" && choice !== "correct" ? (
                <label className="block text-sm font-semibold">
                  {pt(pilotCopy.reviseAction, language)}
                  <input value={revisedNextAction} onChange={(event) => setRevisedNextAction(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <UButton size="sm" onClick={apply} disabled={(choice === "partial" || choice === "missing") && !correctedValue.trim()}>{pt(pilotCopy.applyCorrection, language)}</UButton>
                <UButton size="sm" variant="ghost" onClick={() => setEditing(false)}>{pt(pilotCopy.cancel, language)}</UButton>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function PilotContinuityView({
  continuity,
  language,
  sources,
  corrections,
  reviewMode = false,
  onCorrection,
  onOpenAttachment,
  onSourceReferenceOpened,
  title,
}: {
  continuity: PreparedContinuity;
  language: Language;
  sources: PilotSource[];
  corrections: ClaimCorrection[];
  reviewMode?: boolean;
  onCorrection?: (correction: ClaimCorrection) => void;
  onOpenAttachment?: (source: PilotSource) => void | Promise<void>;
  onSourceReferenceOpened?: (source: PilotSource) => void;
  title?: string;
}) {
  const sortedClaims = useMemo(
    () => [...continuity.claims].sort((a, b) => claimFieldOrder.indexOf(a.field) - claimFieldOrder.indexOf(b.field)),
    [continuity.claims],
  );

  return (
    <div>
      {title ? <h2 className="mb-5 text-2xl font-semibold">{title}</h2> : null}
      <div className="space-y-4">
        {sortedClaims.map((claim) => (
          <ClaimCard
            key={claim.id}
            claim={claim}
            language={language}
            sources={sources}
            corrections={corrections}
            onCorrection={onCorrection}
            onOpenAttachment={onOpenAttachment}
            onSourceReferenceOpened={onSourceReferenceOpened}
            reviewMode={reviewMode}
          />
        ))}
      </div>
    </div>
  );
}
