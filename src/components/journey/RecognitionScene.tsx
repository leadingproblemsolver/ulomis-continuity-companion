import { useEffect, useRef, useState } from "react";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { UButton } from "@/components/ulomis/Button";
import { useLocale } from "@/lib/i18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { phaseToMascot } from "./journeyMascot";
import { cn } from "@/lib/utils";

const STATEMENTS: Record<"en" | "ar", string>[] = [
  { en: "I already researched this.", ar: "لقد بحثتُ في هذا من قبل." },
  { en: "I forgot why I chose that.", ar: "نسيتُ لماذا اخترتُ ذلك." },
  {
    en: "I know the information exists, but not where the decision stands.",
    ar: "أعلم أن المعلومة موجودة، لكن لا أعرف أين وصل القرار.",
  },
  {
    en: "This household depends on me remembering everything.",
    ar: "هذا البيت يعتمد على أن أتذكّر كل شيء.",
  },
];

/**
 * Scene 1 — recognition before explanation (G01). No product tour, no
 * signup, just one felt statement and the entry point into the journey.
 */
export function RecognitionScene({ onStart }: { onStart: () => void }) {
  const { locale } = useLocale();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const pinnedRef = useRef(false);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      if (pinnedRef.current) return;
      setActive((v) => (v + 1) % STATEMENTS.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  return (
    <div className="flex flex-col items-center px-4 py-16 text-center sm:py-24">
      <UlomisMark size={72} {...phaseToMascot.fragmented} decorative />

      <h1 className="mt-8 max-w-2xl text-3xl leading-[1.15] font-semibold text-balance sm:text-5xl">
        {locale === "ar" ? (
          <>
            لقد بذلتَ التفكير بالفعل.
            <span className="mt-1 block text-gradient-thread">لماذا تبدأ من جديد؟</span>
          </>
        ) : (
          <>
            You already did the thinking.
            <span className="mt-1 block text-gradient-thread">Why are you starting again?</span>
          </>
        )}
      </h1>

      <ul
        role="list"
        aria-label={locale === "ar" ? "لحظات مألوفة" : "Familiar moments"}
        className="mt-8 flex max-w-xl flex-wrap justify-center gap-2"
      >
        {STATEMENTS.map((statement, i) => (
          <li key={statement.en}>
            <button
              type="button"
              onClick={() => {
                pinnedRef.current = true;
                setActive(i);
              }}
              aria-pressed={active === i}
              className={cn(
                "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-all duration-500 [transition-timing-function:var(--ease-continuity)]",
                active === i
                  ? "border-primary/45 bg-primary/10 text-foreground"
                  : "border-border bg-surface/70 text-muted-foreground hover:border-primary/25",
              )}
            >
              “{statement[locale]}”
            </button>
          </li>
        ))}
      </ul>

      <UButton size="lg" variant="thread" className="mt-9" onClick={onStart}>
        {locale === "ar" ? "استعِد خيطاً" : "Restore a thread"}
      </UButton>
      <p className="mt-4 text-xs text-muted-foreground">
        {locale === "ar"
          ? "بلا تسجيل. بلا تكامل حقيقي. بلا جولة تعريفية."
          : "No signup. No integrations. No product tour."}
      </p>
    </div>
  );
}
