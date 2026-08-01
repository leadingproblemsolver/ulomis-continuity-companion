import type { Journey } from "@/data/journey";
import { useText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ScenarioSwitcherProps {
  journeys: Journey[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * Scene 2 — quiet alternatives, not three competing products: one small
 * segmented control, same mechanism underneath for all three (G-scenario).
 */
export function ScenarioSwitcher({
  journeys,
  activeId,
  onSelect,
  className,
}: ScenarioSwitcherProps) {
  const t = useText();
  return (
    <div
      role="tablist"
      aria-label="Scenario"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5",
        className,
      )}
    >
      {journeys.map((journey) => {
        const active = journey.id === activeId;
        return (
          <button
            key={journey.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(journey.id)}
            className={cn(
              "focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t(journey.label)}
          </button>
        );
      })}
    </div>
  );
}
