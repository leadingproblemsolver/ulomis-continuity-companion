import {
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  MessagesSquare,
  PanelTop,
  StickyNote,
} from "lucide-react";
import type { ComponentType } from "react";
import { UButton } from "@/components/ulomis/Button";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { ThreadRibbon } from "@/components/ulomis/ThreadRibbon";
import { RESTORE_EVENT } from "@/components/demo/ContinuityDemo";
import { useReveal } from "@/hooks/useReveal";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const fragments: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  drift: { x: number; y: number; rotate: number };
}[] = [
  { icon: PanelTop, label: "Tabs", drift: { x: -10, y: -8, rotate: -5 } },
  { icon: MessageSquare, label: "Messages", drift: { x: 9, y: 7, rotate: 4 } },
  { icon: StickyNote, label: "Notes", drift: { x: -7, y: 10, rotate: 3 } },
  { icon: FileText, label: "Documents", drift: { x: 11, y: -9, rotate: -3 } },
  { icon: Calendar, label: "Calendar", drift: { x: -12, y: 6, rotate: 5 } },
  { icon: Mail, label: "Email", drift: { x: 8, y: 9, rotate: -4 } },
  { icon: MessagesSquare, label: "AI chats", drift: { x: -6, y: -10, rotate: 3.5 } },
];

const outcomes = [
  { label: "Current objective", tone: "text-primary" },
  { label: "Prior decision", tone: "text-confirmed-ink" },
  { label: "Unresolved item", tone: "text-openloop-ink" },
  { label: "Next action", tone: "text-primary" },
];

/**
 * The hero visual: a loose pile of everyday digital debris, a partly-formed
 * Ulomis, and the four things its ribbon resolves the pile into.
 *
 * The whole timeline hangs off a single `shown` boolean with staggered CSS
 * transition delays, so there are no timers to keep in sync and reduced-motion
 * users land on the finished state immediately.
 */
function HeroVisual() {
  const { ref, shown } = useReveal<HTMLDivElement>({ threshold: 0.25 });

  return (
    <div ref={ref} className="w-full max-w-md" aria-hidden>
      <ul className="flex flex-wrap justify-center gap-2">
        {fragments.map((fragment, index) => {
          const Icon = fragment.icon;
          return (
            <li
              key={fragment.label}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all duration-700 [transition-timing-function:var(--ease-continuity)]",
                shown
                  ? "border-border bg-surface text-muted-foreground shadow-[var(--shadow-soft)]"
                  : "border-dashed border-border/70 bg-surface/40 text-muted-foreground/70",
              )}
              style={{
                transform: shown
                  ? "none"
                  : `translate(${fragment.drift.x}px, ${fragment.drift.y}px) rotate(${fragment.drift.rotate}deg)`,
                transitionDelay: `${index * 70}ms`,
              }}
            >
              <Icon className="size-3.5" />
              {fragment.label}
            </li>
          );
        })}
      </ul>

      <div className="relative mt-1 flex flex-col items-center">
        <ThreadRibbon strands={7} progress={shown ? 1 : 0} className="h-16 w-full sm:h-20" />
        <UlomisMark
          size={92}
          state={shown ? "holding" : "forming"}
          progress={shown ? 1 : 0.35}
          eyes={shown}
          decorative
          className="-mt-3"
        />
        <ThreadRibbon
          strands={4}
          direction="fan"
          progress={shown ? 1 : 0}
          className="h-10 w-full max-w-xs sm:h-12"
        />
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {outcomes.map((outcome, index) => (
          <li
            key={outcome.label}
            className={cn(
              "rounded-xl border border-border bg-surface px-3 py-2.5 text-center transition-all duration-700 [transition-timing-function:var(--ease-continuity)]",
              shown ? "opacity-100" : "translate-y-2 opacity-0",
            )}
            style={{ transitionDelay: `${700 + index * 110}ms` }}
          >
            <span className={cn("text-[0.7rem] font-semibold", outcome.tone)}>{outcome.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Hero() {
  function onRestoreClick() {
    track("ulomis_cta_clicked", { cta: "let_ulomis_restore_the_thread", placement: "hero" });
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Let the scroll settle before the thread starts drawing itself.
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(RESTORE_EVENT)), 650);
  }

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-veil)" }}
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            Your apps remember information.
          </p>

          <h1 className="mt-6 text-[2rem] leading-[1.08] font-semibold sm:text-5xl lg:text-6xl">
            Your apps remember everything.
            <span className="mt-1.5 block text-gradient-thread">
              Ulomis remembers why it mattered.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Ulomis connects your decisions, research, conversations, responsibilities, and open
            loops—so you can return without reconstructing everything from memory.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <UButton size="lg" variant="thread" onClick={onRestoreClick}>
              Let Ulomis restore the thread
            </UButton>
            <UButton
              size="lg"
              variant="outline"
              asChild
              onClick={() =>
                track("ulomis_cta_clicked", { cta: "meet_ulomis_early", placement: "hero" })
              }
            >
              <a href="#early-access">Meet Ulomis early</a>
            </UButton>
          </div>

          <p className="mt-7 text-sm text-muted-foreground">
            No new workflow to learn. No blank page to restart from.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
