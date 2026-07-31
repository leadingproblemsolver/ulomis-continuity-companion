import { AlertTriangle, Check } from "lucide-react";
import { UCard } from "@/components/ulomis/Card";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import type { Contradiction, CorrectionOption, Fragment } from "@/data/journey";
import { useLocale, useText } from "@/lib/i18n";
import { EvidenceCard } from "./EvidenceCard";
import { cn } from "@/lib/utils";

interface TrustTestProps {
  uncertainText: string;
  fragments: Fragment[];
  uncertainFrom: string[];
  corrections: CorrectionOption[];
  appliedCorrection: CorrectionOption | null;
  onCorrect: (option: CorrectionOption) => void;

  contradiction: Contradiction;
  resolvedSide: string | null;
  onResolveContradiction: (sideId: string) => void;

  className?: string;
}

/**
 * The pivot of the trust test (G04): Ulomis surfaces one plausible but
 * uncertain connection, the visitor corrects it, and the state visibly
 * changes — not a summary product's static "was this helpful?".
 */
export function TrustTest({
  uncertainText,
  fragments,
  uncertainFrom,
  corrections,
  appliedCorrection,
  onCorrect,
  contradiction,
  resolvedSide,
  onResolveContradiction,
  className,
}: TrustTestProps) {
  const { locale } = useLocale();
  const t = useText();
  const sources = uncertainFrom
    .map((id) => fragments.find((f) => f.id === id))
    .filter(Boolean) as Fragment[];

  return (
    <div className={cn("space-y-5", className)}>
      <UCard variant="outline" padding="lg" className="border-openloop/45 bg-openloop/5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-openloop-ink" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-openloop-ink">
              {locale === "ar" ? "أنا لست متأكداً من هذا" : "I'm not certain about this one"}
            </p>
            <p
              className={cn(
                "mt-1.5 text-sm leading-relaxed sm:text-[0.95rem]",
                appliedCorrection?.dropsClaim
                  ? "text-muted-foreground line-through"
                  : "text-foreground/90",
              )}
            >
              {uncertainText}
            </p>

            {sources.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {sources.map((fragment) => (
                  <EvidenceCard key={fragment.id} fragment={fragment} gathered compact />
                ))}
              </ul>
            )}

            <div
              className="mt-4 flex flex-wrap gap-2"
              role="group"
              aria-label={locale === "ar" ? "صحّح هذا" : "Correct this"}
            >
              {corrections.map((option) => {
                const active = appliedCorrection?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onCorrect(option)}
                    aria-pressed={active}
                    className={cn(
                      "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
                      active
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    {t(option.label)}
                  </button>
                );
              })}
            </div>

            {appliedCorrection && (
              <p className="animate-rise mt-3 flex items-start gap-2 text-sm text-foreground/85">
                <UlomisMark size={20} state="correction" decorative className="mt-0.5" />
                {t(appliedCorrection.response)}
              </p>
            )}
          </div>
        </div>
      </UCard>

      {appliedCorrection && (
        <UCard
          variant="outline"
          padding="lg"
          className="animate-rise border-correction/40 bg-correction/5"
        >
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-correction-ink">
            {locale === "ar" ? "تعارض بين مصدرين" : "Two sources disagree"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
            {t(contradiction.prompt)}
          </p>
          <p className="mt-1 text-sm font-medium">{t(contradiction.question)}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {contradiction.sides.map((side) => {
              const chosen = resolvedSide === side.id;
              return (
                <button
                  key={side.id}
                  type="button"
                  onClick={() => onResolveContradiction(side.id)}
                  aria-pressed={chosen}
                  className={cn(
                    "focus-ring rounded-2xl border p-3.5 text-start transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
                    chosen
                      ? "border-primary/50 bg-primary/5 shadow-[var(--shadow-soft)]"
                      : resolvedSide
                        ? "border-border opacity-50"
                        : "border-border hover:border-primary/30",
                  )}
                >
                  <span className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t(side.origin)}
                    {chosen && <Check className="size-3.5 text-primary" />}
                  </span>
                  <span className="mt-1.5 block text-sm leading-snug font-medium text-foreground/90">
                    {t(side.text)}
                  </span>
                  <span className="mt-1 block text-[0.7rem] text-muted-foreground">
                    {t(side.when)}
                  </span>
                </button>
              );
            })}
          </div>

          {resolvedSide && (
            <p className="animate-rise mt-3 text-sm text-foreground/85">
              {t(contradiction.sides.find((s) => s.id === resolvedSide)!.resolution)}
            </p>
          )}
        </UCard>
      )}
    </div>
  );
}
