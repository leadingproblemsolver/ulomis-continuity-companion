import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-2xl border border-input bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors duration-200 focus:border-primary focus:ring-2 focus:ring-ring/30";

export function Field({
  label,
  hint,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function UInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function UTextarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 resize-y", className)} {...props} />;
}

export function USelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

/**
 * Single-select chip group. Used for the optional "Where do you lose context
 * most?" question, where a row of chips converts better than a select.
 *
 * Implemented as real radio inputs so keyboard arrow-key navigation and form
 * semantics come for free.
 */
export function UChipGroup({
  name,
  options,
  value,
  onChange,
  className,
}: {
  name: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <label
            key={option}
            className={cn(
              "cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-all duration-300 [transition-timing-function:var(--ease-continuity)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
              selected
                ? "border-primary/45 bg-primary/10 text-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={selected}
              // Re-selecting the current chip clears it, keeping the field optional.
              onClick={() => selected && onChange(null)}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {option}
          </label>
        );
      })}
    </div>
  );
}

export function UCheckbox({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: string }) {
  const id = useId();
  return (
    <label
      htmlFor={props.id ?? id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm transition-colors hover:border-primary/40",
        className,
      )}
    >
      <input
        id={props.id ?? id}
        type="checkbox"
        className="mt-0.5 size-4 rounded-md accent-[var(--primary)]"
        {...props}
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}
