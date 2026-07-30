import type { ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  /** Stagger, in milliseconds, relative to the rest of the group. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Reveals its children once, when scrolled into view.
 *
 * The hidden state is a plain `opacity-0` rather than a paused animation, so
 * `animate-rise` (fill mode `both`) holds the from-state through the stagger
 * delay and lands cleanly. Under reduced motion the rise collapses to an
 * instant snap, which is why the visible state is never animation-dependent.
 */
export function Reveal({ children, delay = 0, className, as: Tag = "div" }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn(shown ? "animate-rise" : "opacity-0", className)}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
