import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-3xl transition-all duration-300 [transition-timing-function:var(--ease-continuity)]", {
  variants: {
    variant: {
      plain: "bg-surface border border-border shadow-[var(--shadow-soft)]",
      raised: "bg-surface-raised border border-border shadow-[var(--shadow-lift)]",
      quiet: "bg-accent/50 border border-transparent",
      outline: "border border-dashed border-border bg-transparent",
      thread: "border border-primary/25 bg-surface shadow-[var(--shadow-soft)] relative overflow-hidden",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    },
    interactive: {
      true: "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
      false: "",
    },
  },
  defaultVariants: { variant: "plain", padding: "md", interactive: false },
});

export function UCard({
  className,
  variant,
  padding,
  interactive,
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div className={cn(cardVariants({ variant, padding, interactive }), className)} {...props}>
      {variant === "thread" && (
        <span aria-hidden className="thread-rule absolute inset-x-0 top-0" />
      )}
      {children}
    </div>
  );
}

export function UCardHeader({
  eyebrow,
  title,
  description,
  icon,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4", className)}>
      {icon && (
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </span>
      )}
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
