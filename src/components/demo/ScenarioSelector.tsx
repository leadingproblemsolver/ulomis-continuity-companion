import type { Scenario } from "@/data/scenarios";
import { cn } from "@/lib/utils";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * "Where should Ulomis begin?" — a real tablist, so arrow keys work and the
 * selected scenario is announced.
 */
export function ScenarioSelector({ scenarios, value, onChange, className }: ScenarioSelectorProps) {
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + scenarios.length) % scenarios.length;
    onChange(scenarios[next].id);
    document.getElementById(`scenario-tab-${scenarios[next].id}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Where should Ulomis begin?"
      className={cn("grid gap-2.5 sm:grid-cols-3", className)}
    >
      {scenarios.map((scenario, index) => {
        const active = scenario.id === value;
        return (
          <button
            key={scenario.id}
            id={`scenario-tab-${scenario.id}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls="continuity-demo-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(scenario.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "focus-ring group rounded-2xl border px-4 py-4 text-left transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
              active
                ? "border-primary/45 bg-surface shadow-[var(--shadow-soft)]"
                : "border-border bg-transparent hover:border-primary/25 hover:bg-surface/60",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full transition-colors duration-300",
                  active ? "bg-primary" : "bg-border group-hover:bg-sky",
                )}
              />
              <span className="font-display text-base font-semibold">{scenario.label}</span>
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
              {scenario.blurb}
            </span>
          </button>
        );
      })}
    </div>
  );
}
