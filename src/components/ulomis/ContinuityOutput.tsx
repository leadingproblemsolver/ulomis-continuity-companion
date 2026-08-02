import { ArrowRight, Check, CircleDashed, RefreshCw } from "lucide-react";
import { UCard } from "./Card";
import { UlomisMark, ulomisStateLabel } from "./UlomisMark";
import type { ContinuityThread } from "./threads";
import { cn } from "@/lib/utils";

function Group({
  tone,
  title,
  items,
  icon,
}: {
  tone: "confirmed" | "openloop" | "correction";
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  if (items.length === 0) return null;
  const toneClass = {
    confirmed: "text-confirmed-foreground bg-confirmed/25 border-confirmed/40",
    openloop: "text-openloop-foreground bg-openloop/25 border-openloop/40",
    correction: "text-correction-foreground bg-correction/25 border-correction/40",
  }[tone];

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span className={cn("flex size-6 items-center justify-center rounded-full border", toneClass)}>
          {icon}
        </span>
        {title}
      </p>
      <ul className="space-y-1.5 border-l border-border pl-4">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-foreground/90">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ContinuityOutput({
  thread,
  className,
}: {
  thread: ContinuityThread;
  className?: string;
}) {
  return (
    <UCard
      variant="thread"
      padding="lg"
      className={cn("animate-rise", className)}
      key={thread.id}
    >
      <div className="flex flex-wrap items-start gap-4">
        <UlomisMark size={56} state={thread.state} eyes tail />
        <div className="min-w-0 flex-1">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {thread.kind} · {thread.lastTouched}
          </p>
          <h3 className="mt-1 text-xl font-semibold leading-snug">{thread.summary}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Ulomis is {ulomisStateLabel[thread.state].toLowerCase()}
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <Group
          tone="confirmed"
          title="Already settled"
          items={thread.settled}
          icon={<Check className="size-3.5" />}
        />
        <Group
          tone="openloop"
          title="Still open"
          items={thread.openLoops}
          icon={<CircleDashed className="size-3.5" />}
        />
        <Group
          tone="correction"
          title="Corrected along the way"
          items={thread.corrections}
          icon={<RefreshCw className="size-3.5" />}
        />
      </div>

      <div className="mt-7 flex items-start gap-3 rounded-2xl bg-accent/60 px-4 py-4">
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Where you pick up: </span>
          {thread.resume}
        </p>
      </div>
    </UCard>
  );
}
