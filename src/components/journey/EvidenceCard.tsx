import { Calendar, FileText, Mail, MessageSquare, MessagesSquare, StickyNote } from "lucide-react";
import type { ComponentType } from "react";
import type { EvidenceKind, Fragment, FragmentSource } from "@/data/journey";
import { useLocale, useText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const sourceIcon: Record<FragmentSource, ComponentType<{ className?: string }>> = {
  email: Mail,
  note: StickyNote,
  message: MessageSquare,
  calendar: Calendar,
  "ai-chat": MessagesSquare,
  document: FileText,
};

const kindLabel: Record<EvidenceKind, Record<"en" | "ar", string>> = {
  fact: { en: "Happened", ar: "حدث فعلي" },
  stated: { en: "You said", ar: "قلتَه أنت" },
  inferred: { en: "Ulomis inferred", ar: "استنتجته أولوميس" },
};

const kindTone: Record<EvidenceKind, string> = {
  fact: "border-border text-muted-foreground",
  stated: "border-primary/30 text-primary",
  inferred: "border-openloop/50 text-openloop-ink",
};

interface EvidenceCardProps {
  fragment: Fragment;
  /** Scattered before restoration; settled in place after. */
  gathered: boolean;
  /** Dims fragments the correction flow has withdrawn from the thread. */
  withdrawn?: boolean;
  /** Highlights fragments a claim's "why" panel is currently citing. */
  cited?: boolean;
  /** Dims everything not cited, while a "why" panel is open. */
  dimmed?: boolean;
  index?: number;
  compact?: boolean;
  className?: string;
}

export function EvidenceCard({
  fragment,
  gathered,
  withdrawn,
  cited,
  dimmed,
  index = 0,
  compact = false,
  className,
}: EvidenceCardProps) {
  const { locale } = useLocale();
  const t = useText();
  const Icon = sourceIcon[fragment.source];

  return (
    <li
      className={cn(
        "rounded-2xl border p-3 transition-all duration-700 [transition-timing-function:var(--ease-continuity)]",
        gathered
          ? "border-border bg-surface shadow-[var(--shadow-soft)]"
          : "border-dashed border-border/70 bg-surface/50",
        !fragment.relevant && gathered && "opacity-55",
        cited && "border-primary/45 bg-primary/5",
        dimmed && !cited && "opacity-35",
        withdrawn && "opacity-35 grayscale",
        className,
      )}
      style={{
        transform: gathered
          ? "none"
          : `translate(${fragment.drift.x}px, ${fragment.drift.y}px) rotate(${fragment.drift.rotate}deg)`,
        transitionDelay: gathered ? `${index * 60}ms` : "0ms",
      }}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{t(fragment.origin)}</span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full border px-1.5 py-0.5 text-[0.6rem] font-medium",
            kindTone[fragment.kind],
          )}
        >
          {kindLabel[fragment.kind][locale]}
        </span>
      </span>
      <p
        className={cn(
          "mt-1.5 leading-snug font-medium text-foreground/90",
          compact ? "text-xs" : "text-xs sm:text-[0.8rem]",
        )}
      >
        {t(fragment.text)}
      </p>
      <p className="mt-1 text-[0.7rem] leading-snug text-muted-foreground">{t(fragment.when)}</p>
      {!fragment.relevant && gathered && (
        <p className="mt-1.5 text-[0.65rem] italic text-muted-foreground/80">
          {locale === "ar" ? "لم يُستخدم في هذا الخيط" : "Not used in this thread"}
        </p>
      )}
    </li>
  );
}

export function EvidenceField({
  fragments,
  gathered,
  withdrawnIds = [],
  citedIds,
  className,
}: {
  fragments: Fragment[];
  gathered: boolean;
  withdrawnIds?: string[];
  citedIds?: string[];
  className?: string;
}) {
  const dimmed = Boolean(citedIds?.length);
  return (
    <ul className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3", className)}>
      {fragments.map((fragment, index) => (
        <EvidenceCard
          key={fragment.id}
          fragment={fragment}
          gathered={gathered}
          index={index}
          withdrawn={withdrawnIds.includes(fragment.id)}
          cited={citedIds?.includes(fragment.id)}
          dimmed={dimmed}
        />
      ))}
    </ul>
  );
}
