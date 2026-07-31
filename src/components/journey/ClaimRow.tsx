import { ChevronDown } from "lucide-react";
import { useState, type ComponentType, type ReactNode } from "react";
import type { Claim, Fragment } from "@/data/journey";
import { EvidenceCard } from "./EvidenceCard";
import { useLocale, useText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type ClaimTone = "thread" | "confirmed" | "openloop" | "action";

const toneRing: Record<ClaimTone, string> = {
  thread: "border-primary/35 bg-primary/5 text-primary",
  confirmed: "border-confirmed/50 bg-confirmed/20 text-confirmed-ink",
  openloop: "border-openloop/50 bg-openloop/20 text-openloop-ink",
  action: "border-primary/35 bg-primary/10 text-primary",
};

interface ClaimRowProps {
  icon: ComponentType<{ className?: string }>;
  tone: ClaimTone;
  lead: ReactNode;
  claim: Claim;
  fragments: Fragment[];
  /** For the "outdated"/"unrelated" correction path — replaces the text. */
  overrideText?: string;
  /** Marks the claim as withdrawn from the thread entirely. */
  withdrawn?: boolean;
  onInspect?: () => void;
}

/**
 * One row of the continuity view. "Why" opens the exact fragments this claim
 * rests on — not a generated explanation, the actual source cards (G13).
 */
export function ClaimRow({
  icon: Icon,
  tone,
  lead,
  claim,
  fragments,
  overrideText,
  withdrawn,
  onInspect,
}: ClaimRowProps) {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const t = useText();
  const sources = claim.from
    .map((id) => fragments.find((f) => f.id === id))
    .filter(Boolean) as Fragment[];

  return (
    <li
      className={cn(
        "relative ps-9 transition-opacity duration-500 [transition-timing-function:var(--ease-continuity)]",
        withdrawn && "opacity-45",
      )}
    >
      <span
        className={cn(
          "absolute start-0 top-0.5 flex size-6 items-center justify-center rounded-full border",
          toneRing[tone],
        )}
      >
        <Icon className="size-3.5" />
      </span>

      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {lead}
        </p>
        {sources.length > 0 && !withdrawn && (
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) onInspect?.();
            }}
            className="focus-ring flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-expanded={open}
          >
            {locale === "ar" ? "السبب" : "Why"}
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      <p
        className={cn(
          "mt-1.5 text-sm leading-relaxed sm:text-[0.95rem]",
          withdrawn ? "text-muted-foreground line-through" : "text-foreground/90",
        )}
      >
        {withdrawn ? t(claim.text) : (overrideText ?? t(claim.text))}
      </p>
      {withdrawn && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          {locale === "ar" ? "لم يعُد هذا معتمَداً — تم إسقاطه." : "No longer relied on — dropped."}
        </p>
      )}

      {open && sources.length > 0 && (
        <ul className="animate-rise mt-3 grid gap-2 border-s-2 border-primary/30 ps-3 sm:grid-cols-2">
          {sources.map((fragment) => (
            <EvidenceCard key={fragment.id} fragment={fragment} gathered compact />
          ))}
        </ul>
      )}
    </li>
  );
}
