import type { Fragment } from "@/data/scenarios";
import { UButton } from "@/components/ulomis/Button";
import { cn } from "@/lib/utils";

interface CorrectPanelProps {
  fragments: Fragment[];
  withdrawn: string[];
  onToggle: (fragmentId: string) => void;
  onReset: () => void;
  className?: string;
}

/**
 * The correction affordance. Ulomis states the possibility of being wrong in
 * its own restrained voice, then hands over the actual levers: each fragment
 * can be taken back out of the thread, and the output re-renders around it.
 */
export function CorrectPanel({
  fragments,
  withdrawn,
  onToggle,
  onReset,
  className,
}: CorrectPanelProps) {
  return (
    <div
      className={cn(
        "animate-rise rounded-2xl border border-correction/40 bg-correction/10 p-5",
        className,
      )}
    >
      <p className="text-sm leading-relaxed font-medium">
        I may have joined the wrong threads. Correct me.
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Take anything out that doesn't belong. Whatever depended on it will change.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {fragments.map((fragment) => {
          const isOut = withdrawn.includes(fragment.id);
          return (
            <li key={fragment.id}>
              <button
                type="button"
                onClick={() => onToggle(fragment.id)}
                aria-pressed={isOut}
                className={cn(
                  "focus-ring max-w-full rounded-full border px-3 py-1.5 text-left text-xs transition-all duration-300 [transition-timing-function:var(--ease-continuity)]",
                  isOut
                    ? "border-correction/50 bg-correction/20 text-correction-ink line-through"
                    : "border-border bg-surface text-muted-foreground hover:border-correction/40 hover:text-foreground",
                )}
              >
                <span className="line-clamp-1">{fragment.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {withdrawn.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {withdrawn.length} {withdrawn.length === 1 ? "item" : "items"} taken back out.
          </p>
          <UButton variant="link" size="sm" onClick={onReset} className="h-auto px-0">
            Put them back
          </UButton>
        </div>
      )}
    </div>
  );
}
