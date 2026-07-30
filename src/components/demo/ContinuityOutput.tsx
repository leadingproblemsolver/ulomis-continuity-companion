import { ArrowRight, Check, CircleDashed, Compass } from "lucide-react";
import type { ComponentType } from "react";
import type { ConnectedItem, Scenario } from "@/data/scenarios";
import { UlomisMark, type UlomisState } from "@/components/ulomis/UlomisMark";
import { UCard } from "@/components/ulomis/Card";
import { cn } from "@/lib/utils";

export type ThreadStatus = "restored" | "confirmed" | "corrected";

interface ContinuityOutputProps {
  scenario: Scenario;
  /** Fragment ids the user withdrew via Correct. */
  withdrawn: string[];
  /** Whether the "I connected this because…" rationale is showing. */
  showRationale: boolean;
  status: ThreadStatus;
  className?: string;
}

type Tone = "thread" | "confirmed" | "openloop" | "action";

const toneRing: Record<Tone, string> = {
  thread: "border-primary/35 bg-primary/5 text-primary",
  confirmed: "border-confirmed/50 bg-confirmed/20 text-confirmed-ink",
  openloop: "border-openloop/50 bg-openloop/20 text-openloop-ink",
  action: "border-primary/35 bg-primary/10 text-primary",
};

/**
 * Support state for one connected item.
 *
 * Withdrawing a fragment has to actually cost something, otherwise Correct is a
 * decorative button. An item whose every source is gone is withdrawn outright;
 * one that lost some of its sources is marked as resting on less than it did.
 */
function support(item: ConnectedItem, withdrawn: string[]) {
  const lost = item.from.filter((id) => withdrawn.includes(id));
  if (lost.length === 0) return "intact" as const;
  return lost.length === item.from.length ? ("withdrawn" as const) : ("weakened" as const);
}

function Block({
  icon: Icon,
  tone,
  lead,
  item,
  showRationale,
  withdrawn,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  lead: string;
  item: ConnectedItem;
  showRationale: boolean;
  withdrawn: string[];
}) {
  const state = support(item, withdrawn);

  return (
    <li
      className={cn(
        "relative pl-9 transition-opacity duration-500 [transition-timing-function:var(--ease-continuity)]",
        state === "withdrawn" && "opacity-45",
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-0.5 flex size-6 items-center justify-center rounded-full border",
          toneRing[tone],
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {lead}
      </p>

      {state === "withdrawn" ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          <span className="line-through">{item.text}</span>
          <span className="mt-1.5 block not-italic">
            Nothing is left supporting this. I've let it go.
          </span>
        </p>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 sm:text-[0.95rem]">
          {item.text}
        </p>
      )}

      {state === "weakened" && (
        <p className="mt-2 inline-flex rounded-lg border border-correction/45 bg-correction/15 px-2.5 py-1 text-xs text-correction-ink">
          This now rests on less than it did.
        </p>
      )}

      {showRationale && state !== "withdrawn" && (
        <p className="animate-rise mt-2.5 border-l-2 border-primary/30 pl-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground/70">I connected this because </span>
          {item.because}
        </p>
      )}
    </li>
  );
}

const statusMark: Record<ThreadStatus, UlomisState> = {
  restored: "holding",
  confirmed: "confirmed",
  corrected: "correction",
};

const statusNote: Record<ThreadStatus, string> = {
  restored: "Here is the thread you left.",
  confirmed: "Held. I'll keep this thread as it stands.",
  corrected: "Adjusted. I've dropped what you took back.",
};

export function ContinuityOutput({
  scenario,
  withdrawn,
  showRationale,
  status,
  className,
}: ContinuityOutputProps) {
  return (
    <UCard variant="thread" padding="lg" className={cn("animate-rise", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <UlomisMark size={48} state={statusMark[status]} eyes decorative />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {scenario.label}
          </p>
          <p className="mt-0.5 font-display text-lg leading-snug font-semibold sm:text-xl">
            {statusNote[status]}
          </p>
        </div>
      </div>

      <ol className="mt-8 space-y-7">
        <Block
          icon={Compass}
          tone="thread"
          lead="Where you are"
          item={scenario.currentState}
          showRationale={showRationale}
          withdrawn={withdrawn}
        />
        <Block
          icon={Check}
          tone="confirmed"
          lead="What you already decided"
          item={scenario.priorDecision}
          showRationale={showRationale}
          withdrawn={withdrawn}
        />
        <Block
          icon={CircleDashed}
          tone="openloop"
          lead="This remains unresolved"
          item={scenario.unresolved}
          showRationale={showRationale}
          withdrawn={withdrawn}
        />
        <Block
          icon={ArrowRight}
          tone="action"
          lead="Where you pick up"
          item={scenario.nextAction}
          showRationale={showRationale}
          withdrawn={withdrawn}
        />
      </ol>

      <p className="mt-8 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
        {scenario.closingLine}
      </p>
    </UCard>
  );
}
