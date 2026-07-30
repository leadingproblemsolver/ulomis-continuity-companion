import { cn } from "@/lib/utils";
import type { ContinuityThread } from "./threads";

interface ScenarioSelectorProps {
  threads: ContinuityThread[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ScenarioSelector({ threads, value, onChange, className }: ScenarioSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Choose a thread to continue"
      className={cn("grid gap-2 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {threads.map((thread) => {
        const active = thread.id === value;
        return (
          <button
            key={thread.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(thread.id)}
            className={cn(
              "group rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
              active
                ? "border-primary/40 bg-surface shadow-[var(--shadow-soft)]"
                : "border-border bg-transparent hover:border-primary/25 hover:bg-surface/60",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "size-2 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-border group-hover:bg-sky",
                )}
              />
              <span className="text-sm font-medium">{thread.label}</span>
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
              {thread.summary}
            </span>
          </button>
        );
      })}
    </div>
  );
}
