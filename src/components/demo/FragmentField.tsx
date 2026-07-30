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
import type { Fragment, FragmentSource } from "@/data/scenarios";
import { cn } from "@/lib/utils";

const sourceIcon: Record<FragmentSource, ComponentType<{ className?: string }>> = {
  tab: PanelTop,
  note: StickyNote,
  message: MessageSquare,
  email: Mail,
  calendar: Calendar,
  document: FileText,
  "ai-chat": MessagesSquare,
};

const sourceLabel: Record<FragmentSource, string> = {
  tab: "Tabs",
  note: "Note",
  message: "Messages",
  email: "Email",
  calendar: "Calendar",
  document: "Document",
  "ai-chat": "AI chat",
};

interface FragmentFieldProps {
  fragments: Fragment[];
  /** Scattered until the thread is restored. */
  gathered: boolean;
  /** Ids currently cited by the output — highlighted while the Why panel is open. */
  highlighted?: string[];
  /** Ids the user withdrew via Correct. */
  withdrawn?: string[];
  className?: string;
}

/**
 * The fragmented digital inputs a scenario starts from.
 *
 * Scatter is expressed purely as a transform offset on top of a normal
 * responsive grid, so the layout never breaks at small widths the way absolute
 * positioning would — the pile loosens and tightens, it doesn't reflow.
 */
export function FragmentField({
  fragments,
  gathered,
  highlighted,
  withdrawn = [],
  className,
}: FragmentFieldProps) {
  const isHighlighting = Boolean(highlighted?.length);

  return (
    <ul className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3", className)}>
      {fragments.map((fragment, index) => {
        const Icon = sourceIcon[fragment.source];
        const isWithdrawn = withdrawn.includes(fragment.id);
        const isCited = highlighted?.includes(fragment.id);

        return (
          <li
            key={fragment.id}
            className={cn(
              "rounded-2xl border p-3 transition-all duration-700 [transition-timing-function:var(--ease-continuity)]",
              gathered
                ? "border-border bg-surface shadow-[var(--shadow-soft)]"
                : "border-dashed border-border/70 bg-surface/50",
              isCited && "border-primary/45 bg-primary/5",
              // Dim the uncited ones only while a rationale is on screen.
              isHighlighting && !isCited && "opacity-40",
              isWithdrawn && "opacity-35 grayscale",
            )}
            style={{
              transform: gathered
                ? "none"
                : `translate(${fragment.drift.x}px, ${fragment.drift.y}px) rotate(${fragment.drift.rotate}deg)`,
              transitionDelay: gathered ? `${index * 60}ms` : "0ms",
            }}
          >
            <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Icon className="size-3.5" />
              {sourceLabel[fragment.source]}
            </span>
            <p
              className={cn(
                "mt-1.5 text-xs leading-snug font-medium text-foreground/90 sm:text-[0.8rem]",
                isWithdrawn && "line-through",
              )}
            >
              {fragment.label}
            </p>
            <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">
              {fragment.detail}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
