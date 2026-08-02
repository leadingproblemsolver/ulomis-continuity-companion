import { Languages, LifeBuoy, Moon, ShieldCheck, Sun, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Language } from "../journey-data";
import { UlomisMark } from "../UlomisMark";
import { UButton } from "../Button";
import { useTheme } from "../theme";
import { pilotCopy, pt, stepLabels } from "./pilot-copy";
import { stageToStep, type PilotStage } from "./pilot-types";
import { cn } from "@/lib/utils";

const PILOT_EMAIL = "englishinstructordoha@gmail.com";

export function PilotHeader({
  language,
  onLanguageChange,
  onDelete,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onDelete: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const isArabic = language === "ar";
  const supportSubject = isArabic ? "سؤال عن تجربة أولوميس — ديفيد" : "Ulomis pilot question — David";
  const supportHref = `mailto:${PILOT_EMAIL}?subject=${encodeURIComponent(supportSubject)}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-2.5" aria-label={isArabic ? "الصفحة الرئيسية لأولوميس" : "Ulomis home"}>
          <UlomisMark size={30} state="restored" language={language} />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold tracking-tight">Ulomis</p>
            <p className="truncate text-[0.68rem] text-muted-foreground">{pt(pilotCopy.pilotName, language)}</p>
          </div>
        </a>

        <div className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-0.5 sm:order-none sm:ms-3 sm:w-auto sm:pb-0">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-confirmed/35 bg-confirmed/12 px-3 py-1 text-xs font-semibold text-confirmed-foreground">
            <ShieldCheck className="size-3.5" aria-hidden />
            {pt(pilotCopy.assisted, language)}
          </span>
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            {pt(pilotCopy.noIntegrations, language)}
          </span>
        </div>

        <div className="ms-auto flex items-center gap-1">
          <div className="flex items-center rounded-full border border-border bg-surface p-1" aria-label={isArabic ? "اختيار اللغة" : "Language selection"}>
            <Languages className="mx-2 size-4 text-muted-foreground" aria-hidden />
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              aria-pressed={language === "en"}
              className="rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("ar")}
              aria-pressed={language === "ar"}
              className="rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              dir="rtl"
            >
              العربية
            </button>
          </div>
          <UButton variant="ghost" size="icon" onClick={toggleTheme} aria-label={isArabic ? (theme === "dark" ? "استخدم الوضع الفاتح" : "استخدم الوضع الداكن") : (theme === "dark" ? "Switch to light mode" : "Switch to dark mode")}>

            {theme === "dark" ? <Sun /> : <Moon />}
          </UButton>
          <UButton variant="ghost" size="icon" asChild aria-label={pt(pilotCopy.support, language)}>
            <a href={supportHref}><LifeBuoy /></a>
          </UButton>
          <UButton variant="ghost" size="icon" onClick={onDelete} aria-label={pt(pilotCopy.deleteData, language)}>
            <Trash2 />
          </UButton>
        </div>
      </div>
    </header>
  );
}

export function PilotProgress({ stage, language }: { stage: PilotStage; language: Language }) {
  const active = stageToStep(stage);
  return (
    <nav aria-label={language === "ar" ? "تقدم التجربة" : "Pilot progress"} className="border-b border-border/70 bg-surface/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between gap-4 md:hidden">
          <p className="text-sm font-semibold">
            {pt(pilotCopy.stepOf, language)} {active} {pt(pilotCopy.of, language)} 6 — {pt(stepLabels[active], language)}
          </p>
          <span className="text-xs text-muted-foreground">{Math.round((active / 6) * 100)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted md:hidden" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(active / 6) * 100}%` }} />
        </div>
        <ol className="hidden grid-cols-6 gap-2 md:grid">
          {([1, 2, 3, 4, 5, 6] as const).map((step) => {
            const complete = step < active;
            const current = step === active;
            return (
              <li key={step} className="min-w-0">
                <div className="mb-2 flex items-center gap-2" aria-current={current ? "step" : undefined}>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      complete && "border-confirmed bg-confirmed text-confirmed-foreground",
                      current && "border-primary bg-primary text-primary-foreground",
                      !complete && !current && "border-border bg-surface text-muted-foreground",
                    )}
                  >
                    {complete ? "✓" : step}
                  </span>
                  <span className={cn("truncate text-xs font-semibold", current ? "text-foreground" : "text-muted-foreground")}>{pt(stepLabels[step], language)}</span>
                </div>
                <div className={cn("h-1 rounded-full", complete || current ? "bg-primary" : "bg-muted")} aria-hidden />
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export function StepFrame({
  eyebrow,
  title,
  body,
  time,
  next,
  language,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  time: string;
  next: string;
  language: Language;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
      <section className="min-w-0">
        <div className="mb-7 max-w-3xl">
          {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{body}</p>
        </div>
        {children}
      </section>
      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{pt(pilotCopy.estimated, language)}</p>
          <p className="mt-2 text-sm font-semibold">{time}</p>
          <div className="my-4 h-px bg-border" />
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{pt(pilotCopy.whatNext, language)}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{next}</p>
        </div>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{pt(pilotCopy.dataBoundary, language)}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{pt(pilotCopy.localOnly, language)}</p>
        </div>
        {aside}
      </aside>
    </div>
  );
}
