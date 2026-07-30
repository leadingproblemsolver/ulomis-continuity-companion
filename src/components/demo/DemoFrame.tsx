import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Light application chrome around the demo, so the simulation reads as a
 * surface rather than as more page. Deliberately generic — it isn't imitating
 * any real browser or app.
 */
export function DemoFrame({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-secondary/60 px-4 py-3">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </span>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
