import { ArrowRight } from "lucide-react";
import { UCard } from "@/components/ulomis/Card";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import type { Journey } from "@/data/journey";
import { useLocale, useText } from "@/lib/i18n";

/**
 * Scene 9 — a short, static epilogue, not a second demo. Shows what a future
 * return would look like: one new fragment arrives, the state updates, and
 * there's still one next action — never a blank dashboard.
 */
export function ReturnPreview({ journey }: { journey: Journey }) {
  const { locale } = useLocale();
  const t = useText();
  const preview = journey.returnPreview;

  const steps = [
    { label: locale === "ar" ? "الحالة السابقة" : "Previous state", text: t(preview.previousState) },
    {
      label: t(preview.newFragment.origin),
      text: t(preview.newFragment.text),
      isNew: true,
    },
    { label: locale === "ar" ? "ما الذي تغيّر" : "What changed", text: t(preview.changed) },
    { label: locale === "ar" ? "لا يزال مفتوحاً" : "Still open", text: t(preview.stillOpen) },
    {
      label: locale === "ar" ? "الخطوة التالية الحالية" : "Current next action",
      text: t(preview.nextAction),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <UlomisMark size={36} state="holding" progress={1} eyes decorative />
        <div>
          <p className="font-display text-lg font-semibold">
            {locale === "ar" ? "عندما تعود" : "When you return"}
          </p>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "أولوميس يعرض ما تغيّر — لا لوحة فارغة."
              : "Ulomis shows what changed — not a blank dashboard."}
          </p>
        </div>
      </div>

      <UCard variant="outline" padding="lg" className="mt-5">
        <ol className="flex flex-col gap-4">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold ${
                    step.isNew
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRight
                    className="mt-1 size-3.5 rotate-90 text-muted-foreground/50 rtl:rotate-90"
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {step.label}
                  {step.isNew && (
                    <span className="ms-1.5 rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-medium normal-case tracking-normal text-primary">
                      {locale === "ar" ? "جديد" : "new"}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </UCard>
    </div>
  );
}
