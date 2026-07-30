import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "start" | "center";
  tone?: "default" | "quiet" | "deep";
  width?: "narrow" | "default";
}

const widthClass = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
} as const;

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className,
  align = "start",
  tone = "default",
  width = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "w-full scroll-mt-24 py-16 sm:py-24",
        tone === "quiet" && "bg-accent/35",
        tone === "deep" && "bg-secondary/50",
        className,
      )}
    >
      <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widthClass[width])}>
        {(eyebrow || title || lede) && (
          <header
            className={cn("mb-10 max-w-2xl sm:mb-14", align === "center" && "mx-auto text-center")}
          >
            {eyebrow && (
              <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-2xl font-semibold leading-tight sm:text-4xl">{title}</h2>}
            {lede && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {lede}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
