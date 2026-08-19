import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CircleDashed, Compass } from "lucide-react";
import { UButton } from "@/components/ulomis/Button";
import { UCard } from "@/components/ulomis/Card";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { ThreadRibbon } from "@/components/ulomis/ThreadRibbon";
import {
  journeys,
  defaultJourneyId,
  getJourney,
  type CorrectionOption,
  type NextActionOption,
} from "@/data/journey";
import { useLocale, useText } from "@/lib/i18n";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { track, trackOnce } from "@/lib/analytics";
import { EvidenceField } from "./EvidenceCard";
import { ClaimRow } from "./ClaimRow";
import { TrustTest } from "./TrustTest";
import { Continuation } from "./Continuation";
import { RecognitionScene } from "./RecognitionScene";
import { ScenarioSwitcher } from "./ScenarioSwitcher";
import { RealThreadHandoff } from "./RealThreadHandoff";
import { TrustStrip } from "./TrustStrip";
import { ReturnPreview } from "./ReturnPreview";
import { phaseToMascot, type JourneyPhase } from "./journeyMascot";
import { cn } from "@/lib/utils";

type Stage = "recognition" | "scattered" | "connecting" | "restored";

const CONNECT_MS = 1300;

function scenarioFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("scenario");
  return q && journeys.some((j) => j.id === q) ? q : null;
}

function directFirstValueFromQuery(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("start") === "real-thread";
}

export function RestorationJourney() {
  const { locale } = useLocale();
  const t = useText();
  const reducedMotion = useReducedMotion();

  const [scenarioId, setScenarioId] = useState(defaultJourneyId);
  const journey = useMemo(() => getJourney(scenarioId), [scenarioId]);

  const [stage, setStage] = useState<Stage>("recognition");
  const [directFirstValue, setDirectFirstValue] = useState(false);
  const [appliedCorrection, setAppliedCorrection] = useState<CorrectionOption | null>(null);
  const [resolvedSide, setResolvedSide] = useState<string | null>(null);
  const [chosenAction, setChosenAction] = useState<NextActionOption | null>(null);

  // Query params are honored after mount rather than during initial render so
  // SSR and hydration always begin from the same stable default.
  useEffect(() => {
    const fromQuery = scenarioFromQuery();
    if (fromQuery) setScenarioId(fromQuery);
    if (directFirstValueFromQuery()) {
      setDirectFirstValue(true);
      trackOnce("ulomis_cta_clicked", { cta: "direct_real_thread_entry" });
    }
  }, []);

  const selectScenario = useCallback(
    (id: string) => {
      if (id === scenarioId) return;
      track("scenario_selected", { scenario: id });
      setScenarioId(id);
      setStage("scattered");
      setAppliedCorrection(null);
      setResolvedSide(null);
      setChosenAction(null);
    },
    [scenarioId],
  );

  const beginScenario = useCallback(() => {
    setStage("scattered");
    track("demo_started", { journey: journey.id });
  }, [journey.id]);

  const restore = useCallback(() => {
    setStage("connecting");
    window.setTimeout(
      () => {
        setStage("restored");
        track("restoration_completed", { journey: journey.id });
      },
      reducedMotion ? 100 : CONNECT_MS,
    );
  }, [journey.id, reducedMotion]);

  const applyCorrection = useCallback(
    (option: CorrectionOption) => {
      setAppliedCorrection(option);
      const event =
        option.id === "correct"
          ? "item_confirmed"
          : option.id === "unrelated"
            ? "item_dismissed"
            : "item_corrected";
      track(event, { journey: journey.id, correction: option.id });
    },
    [journey.id],
  );

  const resolveContradiction = useCallback(
    (sideId: string) => {
      setResolvedSide(sideId);
      track("contradiction_resolved", { journey: journey.id, side: sideId });
    },
    [journey.id],
  );

  const chooseAction = useCallback(
    (option: NextActionOption) => {
      setChosenAction(option);
      track("next_action_selected", { journey: journey.id, action: option.id });
      trackOnce("demo_first_value_completed", {});
    },
    [journey.id],
  );

  const inspectClaim = useCallback(
    (field: string) => {
      track("why_opened", { journey: journey.id, field });
    },
    [journey.id],
  );

  const relevantIds = useMemo(
    () => journey.fragments.filter((f) => f.relevant).map((f) => f.id),
    [journey.fragments],
  );

  if (directFirstValue) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {locale === "ar" ? "اختبار القيمة الأولى" : "First-value test"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "ar"
                ? "خيط حقيقي واحد. نتيجة واحدة قبل أي تسجيل."
                : "One real thread. One result before any signup."}
            </p>
          </div>
          <UButton
            size="sm"
            variant="ghost"
            onClick={() => {
              setDirectFirstValue(false);
              track("ulomis_cta_clicked", { cta: "direct_entry_to_guided_demo" });
            }}
          >
            {locale === "ar" ? "شاهد المثال الموجّه" : "See guided example"}
          </UButton>
        </div>
        <RealThreadHandoff />
        <div className="mt-8">
          <TrustStrip />
        </div>
      </div>
    );
  }

  const phase: JourneyPhase =
    stage === "scattered"
      ? "gathering"
      : stage === "connecting"
        ? "connecting"
        : resolvedSide
          ? chosenAction
            ? "completed"
            : "contradicted"
          : appliedCorrection
            ? appliedCorrection.id === "missing"
              ? "no_match"
              : "corrected"
            : "uncertain";

  if (stage === "recognition") {
    return <RecognitionScene onStart={beginScenario} />;
  }

  const gathered = stage !== "scattered";
  const restored = stage === "restored";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t(journey.premise)}</p>
        <ScenarioSwitcher journeys={journeys} activeId={journey.id} onSelect={selectScenario} />
      </div>

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

        {!gathered && (
          <p className="mt-3 text-sm text-foreground/80">
            {locale === "ar"
              ? "بقيت المعلومات. لكن الخيط انقطع."
              : "The information survived. The thread did not."}
          </p>
        )}

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
            <p className="font-display text-lg font-semibold sm:text-xl">{t(journey.title)}</p>

            <ol className="space-y-6">
              <ClaimRow
                icon={Compass}
                tone="thread"
                lead={locale === "ar" ? "أين أنت الآن" : "Where you are"}
                claim={journey.before}
                fragments={journey.fragments}
                onInspect={() => inspectClaim("current_objective")}
              />
              {journey.changes.map((change, i) => (
                <ClaimRow
                  key={i}
                  icon={ArrowRight}
                  tone="thread"
                  lead={locale === "ar" ? "ما الذي تغيّر" : "What changed"}
                  claim={change}
                  fragments={journey.fragments}
                  onInspect={() => inspectClaim(`change_${i}`)}
                />
              ))}
              <ClaimRow
                icon={Check}
                tone="confirmed"
                lead={locale === "ar" ? "ما قرّرتَه" : "What you decided"}
                claim={journey.decision}
                fragments={journey.fragments}
                onInspect={() => inspectClaim("decision")}
              />
              <ClaimRow
                icon={CircleDashed}
                tone="openloop"
                lead={locale === "ar" ? "لا يزال مفتوحاً" : "Still open"}
                claim={journey.openItem}
                fragments={journey.fragments}
                onInspect={() => inspectClaim("open_item")}
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
                onInspect={() => inspectClaim("next_action")}
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
                  ? "دَع أولوميس يعيد وصل هذا الخيط"
                  : "Let Ulomis restore this thread"}
              {stage !== "connecting" && <ArrowRight className="rtl:rotate-180" />}
            </UButton>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {locale === "ar"
                ? "هذا مثال موجَّه بمعطيات مكتوبة، وليس اتصالاً حقيقياً بأي تطبيق."
                : "This is a guided, simulated example using written data — not a live connection to any app."}
            </p>
          </div>
        )}
      </UCard>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {relevantIds.length < journey.fragments.length &&
          (locale === "ar"
            ? "بعض القطع أعلاه لم تكن ذات صلة — بقيت قابلة للفحص، ولم تُستخدم في الخيط."
            : "Some of the pieces above weren't relevant — they stayed inspectable, not used in the thread.")}
      </p>

      {restored && chosenAction && (
        <div className="mt-10 space-y-10">
          <RealThreadHandoff />
          <TrustStrip />
          <ReturnPreview journey={journey} />
        </div>
      )}
    </div>
  );
}
