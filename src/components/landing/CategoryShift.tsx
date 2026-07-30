import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { cn } from "@/lib/utils";

const stages = [
  {
    label: "Apps",
    body: "Each one holds its own piece perfectly, and none of them hold the relationship between the pieces.",
    tone: "border-border",
  },
  {
    label: "Context",
    body: "The decisions, the reasons, the things left open — the material that never belonged to any single app.",
    tone: "border-sky/50",
  },
  {
    label: "Continuity",
    body: "What you actually wanted: the ability to pick the work back up rather than reconstruct it.",
    tone: "border-primary/40",
  },
];

export function CategoryShift() {
  return (
    <Section
      id="category"
      tone="quiet"
      eyebrow="The shift"
      title="What if your digital world remembered the thread?"
      lede="Storage was solved a long time ago. Search was solved after that. The layer nobody built is the one that keeps the thread running between them."
    >
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {stages.map((stage, index) => (
          <Fragment key={stage.label}>
            <Reveal delay={index * 140} className="flex-1">
              <div
                className={cn(
                  "h-full rounded-3xl border-2 bg-surface p-6 shadow-[var(--shadow-soft)]",
                  stage.tone,
                )}
              >
                <p className="font-display text-xl font-semibold">{stage.label}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
              </div>
            </Reveal>
            {index < stages.length - 1 && (
              <ArrowRight
                aria-hidden
                className="mx-auto size-5 shrink-0 rotate-90 text-muted-foreground sm:rotate-0"
              />
            )}
          </Fragment>
        ))}
      </div>

      <Reveal delay={420}>
        <div className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <UlomisMark size={52} state="holding" decorative />
          <p className="text-base leading-relaxed text-balance sm:text-lg">
            That layer is what Ulomis is. Not another place to put things —{" "}
            <span className="font-medium">
              the thread running between the places you already use.
            </span>
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
