import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { getScenario, scenarios } from "@/data/scenarios";
import { track } from "@/lib/analytics";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { UButton } from "@/components/ulomis/Button";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { ThreadRibbon } from "@/components/ulomis/ThreadRibbon";
import { ScenarioSelector } from "./ScenarioSelector";
import { FragmentField } from "./FragmentField";
import { ContinuityOutput, type ThreadStatus } from "./ContinuityOutput";
import { ThreadControls, type ThreadControl } from "./ThreadControls";
import { CorrectPanel } from "./CorrectPanel";
import { DemoFrame } from "./DemoFrame";

type Phase = "scattered" | "connecting" | "restored";

const CONNECT_MS = 1400;

/** Lets the hero CTA start the demo without threading callbacks through the page. */
export const RESTORE_EVENT = "ulomis:restore-thread";

export function ContinuityDemo() {
  const reducedMotion = useReducedMotion();

  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [phase, setPhase] = useState<Phase>("scattered");
  const [withdrawn, setWithdrawn] = useState<string[]>([]);
  const [showWhy, setShowWhy] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scenario = getScenario(scenarioId);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const reset = useCallback(() => {
    clearTimer();
    setPhase("scattered");
    setWithdrawn([]);
    setShowWhy(false);
    setShowCorrect(false);
    setConfirmed(false);
    setNotice(null);
  }, []);

  const restore = useCallback(() => {
    clearTimer();
    setNotice(null);
    setPhase("connecting");
    track("ulomis_demo_started", { scenario: scenarioId });

    // Reduced motion still gets the connecting beat, just not the wait.
    timer.current = setTimeout(
      () => {
        setPhase("restored");
        track("ulomis_demo_completed", { scenario: scenarioId });
      },
      reducedMotion ? 120 : CONNECT_MS,
    );
  }, [scenarioId, reducedMotion]);

  // The hero's primary CTA scrolls here and fires this. Phase is read from a ref
  // so the listener stays stable and never runs an effect inside a state updater.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const onExternalRestore = () => {
      if (phaseRef.current === "scattered") restore();
    };
    window.addEventListener(RESTORE_EVENT, onExternalRestore);
    return () => window.removeEventListener(RESTORE_EVENT, onExternalRestore);
  }, [restore]);

  function selectScenario(id: string) {
    if (id === scenarioId) return;
    setScenarioId(id);
    reset();
    track("ulomis_demo_scenario_selected", { scenario: id });
  }

  function toggleFragment(fragmentId: string) {
    setWithdrawn((current) =>
      current.includes(fragmentId)
        ? current.filter((id) => id !== fragmentId)
        : [...current, fragmentId],
    );
    setConfirmed(false);
  }

  function onControl(control: ThreadControl) {
    track("ulomis_demo_control_used", { scenario: scenarioId, control });

    switch (control) {
      case "confirm":
        setConfirmed(true);
        setShowCorrect(false);
        setNotice("Held. Ulomis will keep this thread as it stands.");
        break;
      case "correct":
        setShowCorrect((v) => !v);
        setNotice(null);
        break;
      case "why":
        setShowWhy((v) => !v);
        break;
      case "dismiss":
        track("ulomis_demo_dismissed", { scenario: scenarioId });
        reset();
        setNotice("Set aside. Nothing kept.");
        break;
    }
  }

  const status: ThreadStatus = confirmed
    ? "confirmed"
    : withdrawn.length
      ? "corrected"
      : "restored";
  const gathered = phase !== "scattered";
  const restored = phase === "restored";

  /** Fragments the output currently cites — highlighted while Why is open. */
  const cited = useMemo(() => {
    const items = [
      scenario.currentState,
      scenario.priorDecision,
      scenario.unresolved,
      scenario.nextAction,
    ];
    return Array.from(new Set(items.flatMap((item) => item.from)));
  }, [scenario]);

  return (
    <div>
      <ScenarioSelector scenarios={scenarios} value={scenarioId} onChange={selectScenario} />

      <div
        id="continuity-demo-panel"
        role="tabpanel"
        aria-label={`${scenario.label} scenario`}
        className="mt-5"
      >
        <DemoFrame label={`Ulomis · ${scenario.label}`}>
          {/* 1. The fragmented inputs */}
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {gathered ? "Gathered" : "Scattered"} · {scenario.fragments.length} pieces
            </p>
            {!restored && (
              <p className="text-xs text-muted-foreground">
                {phase === "connecting" ? "Following the thread…" : "Nothing is connected yet."}
              </p>
            )}
          </div>

          <FragmentField
            className="mt-4"
            fragments={scenario.fragments}
            gathered={gathered}
            highlighted={showWhy && restored ? cited : undefined}
            withdrawn={withdrawn}
          />

          {/* 2. Ulomis connecting them */}
          <div className="relative mt-2 flex flex-col items-center">
            <ThreadRibbon
              strands={scenario.fragments.length}
              progress={gathered ? 1 : 0}
              className="h-14 w-full max-w-md sm:h-20"
            />
            <UlomisMark
              size={64}
              state={
                restored
                  ? confirmed
                    ? "confirmed"
                    : withdrawn.length
                      ? "correction"
                      : "holding"
                  : phase === "connecting"
                    ? "attentive"
                    : "forming"
              }
              progress={gathered ? 1 : 0.35}
              eyes={restored}
              className="-mt-2"
            />
          </div>

          {/* 3–6. The restored thread */}
          {restored ? (
            <div className="mt-6 space-y-5">
              <div aria-live="polite">
                <ContinuityOutput
                  key={scenario.id}
                  scenario={scenario}
                  withdrawn={withdrawn}
                  showRationale={showWhy}
                  status={status}
                />
              </div>

              {/* 7. Controls */}
              <ThreadControls
                onControl={onControl}
                confirmed={confirmed}
                active={[
                  ...(showCorrect ? (["correct"] as const) : []),
                  ...(showWhy ? (["why"] as const) : []),
                ]}
              />

              {showCorrect && (
                <CorrectPanel
                  fragments={scenario.fragments}
                  withdrawn={withdrawn}
                  onToggle={toggleFragment}
                  onReset={() => setWithdrawn([])}
                />
              )}

              {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <UButton
                  variant="thread"
                  asChild
                  onClick={() => track("ulomis_cta_clicked", { cta: "give_one_real_thread" })}
                >
                  <a href="#early-access">Give Ulomis one real thread</a>
                </UButton>
                <UButton variant="ghost" size="sm" onClick={reset}>
                  Start over
                </UButton>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <UButton
                size="lg"
                variant="thread"
                onClick={restore}
                disabled={phase === "connecting"}
              >
                {phase === "connecting" ? "Restoring…" : "Restore the thread"}
                {phase !== "connecting" && <ArrowDown />}
              </UButton>
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                {notice ?? "No account, no setup. This is a simulation of the experience."}
              </p>
            </div>
          )}
        </DemoFrame>
      </div>
    </div>
  );
}
