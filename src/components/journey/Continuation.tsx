import { UlomisMark } from "@/components/ulomis/UlomisMark";
import type { NextActionOption } from "@/data/journey";
import { useText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ContinuationProps {
  options: NextActionOption[];
  chosen: NextActionOption | null;
  onChoose: (option: NextActionOption) => void;
  className?: string;
}

/**
 * Scene 7 — choosing one next action is the first-value event, not merely
 * reaching the continuity view (G07).
 */
export function Continuation({ options, chosen, onChoose, className }: ContinuationProps) {
  const t = useText();
  const primary = options.filter((o) => o.primary);
  const rest = options.filter((o) => !o.primary);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {[...primary, ...rest].map((option) => {
          const active = chosen?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option)}
              aria-pressed={active}
              className={cn(
                "focus-ring rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
                active
                  ? "border-transparent text-primary-foreground [background-image:var(--gradient-thread)] shadow-[var(--shadow-soft)]"
                  : option.primary
                    ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                    : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {t(option.label)}
            </button>
          );
        })}
      </div>

      {chosen && (
        <p className="animate-rise flex items-start gap-2 text-sm text-foreground/85">
          <UlomisMark size={20} state="confirmed" decorative className="mt-0.5" />
          {t(chosen.confirmation)}
        </p>
      )}
    </div>
  );
}
