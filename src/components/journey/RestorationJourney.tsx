import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Check, CircleDashed, Compass } from "lucide-react";
import { UButton } from "@/components/ulomis/Button";
import { UCard } from "@/components/ulomis/Card";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { ThreadRibbon } from "@/components/ulomis/ThreadRibbon";
import type { CorrectionOption, Journey, NextActionOption } from "@/data/journey";
import { useLocale, useText } from "@/lib/i18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track } from "@/lib/analytics";
import { EvidenceField } from "./EvidenceCard";
import { ClaimRow } from "./ClaimRow";
import { TrustTest } from "./TrustTest";
import { Continuation } from "./Continuation";
import { RecognitionScene } from "./RecognitionScene";
import { phaseToMascot, type JourneyPhase } from "./journeyMascot";
import { cn } from "@/lib/utils";

type Stage = "recognition" | "scattered" | "connecting" | "restored";

const CONNECT_MS = 1300;

export function RestorationJourney({ journey }: { journey: Journey }) {
  const { locale } = useLocale();
  const t = useText();
  const reducedMotion = useReducedMotion();

  const [stage, setStage] = useState<Stage>("recognition");
  const [appliedCorrection, setAppliedCorrection] = useState<CorrectionOption | null>(null);
  const [resolvedSide, setResolvedSide] = useState<string | null>(null);
  const [chosenAction, setChosenAction] = useState<NextActionOption | null>(null);

  const beginScenario = useCallback(() => {
    setStage("scattered");
    track("journey_scenario_started", { journey: journey.id });
  }, [journey.id]);

  const restore = useCallback(() => {
    setStage("connecting");
    window.setTimeout(
      () => {
        setStage("restored");
        track("journey_restored", { journey: journey.id });
      },
      reducedMotion ? 100 : CONNECT_MS,
    );
  }, [journey.id, reducedMotion]);

  const applyCorrection = useCallback(
    (option: CorrectionOption) => {
      setAppliedCorrection(option);
      track("journey_correction_applied", { journey: journey.id, correction: option.id });
    },
    [journey.id],
  );

  const resolveContradiction = useCallback(
    (sideId: string) => {
      setResolvedSide(sideId);
      track("journey_contradiction_resolved", { journey: journey.id, side: sideId });
    },
    [journey.id],
  );

  const chooseAction = useCallback(
    (option: NextActionOption) => {
      setChosenAction(option);
      track("journey_next_action_selected", { journey: journey.id, action: option.id });
    },
    [journey.id],
  );

  const relevantIds = useMemo(
    () => journey.fragments.filter((f) => f.relevant).map((f) => f.id),
    [journey.fragments],
  );

  const withdrawnIds = appliedCorrection?.dropsClaim ? journey.uncertain.from : [];

  const phase: JourneyPhase =
    stage === "scattered"
      ? "gathering"
      : stage === "connecting"
        ? "connecting"
        : resolvedSide
          ? chosenAction
            ? "complete"
            : "contradiction"
          : appliedCorrection
            ? "correction"
            : "uncertain";

  if (stage === "recognition") {
    return <RecognitionScene onStart={beginScenario} />;
  }

  const gathered = stage !== "scattered";
  const restored = stage === "restored";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
      <p className="text-center text-sm text-muted-foreground">{t(journey.premise)}</p>

      <UCard variant="raised" padding="lg" className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {gathered
              ? locale === "ar"
                ? "مُجمَّع"
                : "Gathered"
              : locale === "ar"
                ? "متفرّق"
                : "Scattered"}{" "}
            · {journey.fragments.length}
          </p>
          {!restored && (
            <p className="text-xs text-muted-foreground">
              {stage === "connecting"
                ? locale === "ar"
                  ? "يتتبّع الخيط…"
                  : "Following the thread…"
                : locale === "ar"
                  ? "لا شيء متّصل بعد."
                  : "Nothing is connected yet."}
            </p>
          )}
        </div>

        <EvidenceField className="mt-4" fragments={journey.fragments} gathered={gathered} />

        <div className="relative mt-2 flex flex-col items-center">
          <ThreadRibbon
            strands={journey.fragments.length}
            progress={gathered ? 1 : 0}
            className="h-14 w-full max-w-md sm:h-20"
          />
          <UlomisMark size={64} {...phaseToMascot[phase]} className="-mt-2" />
        </div>

        {restored ? (
          <div className="mt-6 space-y-6">
            <ol className="space-y-6">
              <ClaimRow
                icon={Compass}
                tone="thread"
                lead={locale === "ar" ? "أين أنت الآن" : "Where you are"}
                claim={journey.before}
                fragments={journey.fragments}
              />
              {journey.changes.map((change, i) => (
                <ClaimRow
                  key={i}
                  icon={ArrowRight}
                  tone="thread"
                  lead={locale === "ar" ? "ما الذي تغيّر" : "What changed"}
                  claim={change}
                  fragments={journey.fragments}
                />
              ))}
              <ClaimRow
                icon={Check}
                tone="confirmed"
                lead={locale === "ar" ? "ما قرّرتَه" : "What you decided"}
                claim={journey.decision}
                fragments={journey.fragments}
              />
              <ClaimRow
                icon={CircleDashed}
                tone="openloop"
                lead={locale === "ar" ? "لا يزال مفتوحاً" : "Still open"}
                claim={journey.openItem}
                fragments={journey.fragments}
              />
              <ClaimRow
                icon={ArrowRight}
                tone="action"
                lead={locale === "ar" ? "الخطوة التالية" : "Next action"}
                claim={journey.nextAction}
                fragments={journey.fragments}
                overrideText={
                  appliedCorrection?.nextActionOverride
                    ? t(appliedCorrection.nextActionOverride)
                    : undefined
                }
              />
            </ol>

            <p className="border-t border-border pt-4 text-xs text-muted-foreground">
              {locale === "ar" ? "آخر تأكيد: " : "Last confirmed: "}
              {t(journey.lastConfirmed)}
            </p>

            <div className="border-t border-border pt-6">
              <TrustTest
                uncertainText={t(journey.uncertain.text)}
                fragments={journey.fragments}
                uncertainFrom={journey.uncertain.from}
                corrections={journey.corrections}
                appliedCorrection={appliedCorrection}
                onCorrect={applyCorrection}
                contradiction={journey.contradiction}
                resolvedSide={resolvedSide}
                onResolveContradiction={resolveContradiction}
              />
            </div>

            {resolvedSide && (
              <div className="border-t border-border pt-6">
                <p className="mb-3 text-sm font-medium">
                  {locale === "ar"
                    ? "ماذا تريد أن تفعل بهذا الخيط؟"
                    : "What do you want to do with this thread?"}
                </p>
                <Continuation
                  options={journey.nextActions}
                  chosen={chosenAction}
                  onChoose={chooseAction}
                />
              </div>
            )}
          </div>
        ) : (
          <div className={cn("mt-6 flex flex-col items-center gap-3 text-center")}>
            <UButton size="lg" variant="thread" onClick={restore} disabled={stage === "connecting"}>
              {stage === "connecting"
                ? locale === "ar"
                  ? "جارٍ الاستعادة…"
                  : "Restoring…"
                : locale === "ar"
                  ? "دَع أولوميس يستعيد هذا الخيط"
                  : "Let Ulomis restore this thread"}
              {stage !== "connecting" && <ArrowRight className="rtl:rotate-180" />}
            </UButton>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {locale === "ar"
                ? "هذا مثال موجَّه بمعطيات مكتوبة، وليس اتصالاً حقيقياً بأي تطبيق."
                : "This is a guided example using written data — not a live connection to any app."}
            </p>
          </div>
        )}
      </UCard>

      {restored && chosenAction && (
        <div className="mt-8 text-center">
          <UButton variant="thread" size="lg" asChild>
            <a href="#early-access">
              {locale === "ar"
                ? "امنح أولوميس خيطاً حقيقياً واحداً"
                : "Give Ulomis one real thread"}
            </a>
          </UButton>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {relevantIds.length < journey.fragments.length &&
          (locale === "ar"
            ? "بعض القطع أعلاه لم تكن ذات صلة — بقيت قابلة للفحص، ولم تُستخدم في الخيط."
            : "Some of the pieces above weren't relevant — they stayed inspectable, not used in the thread.")}
      </p>
    </div>
  );
}
