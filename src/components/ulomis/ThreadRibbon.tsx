import { cn } from "@/lib/utils";

interface ThreadRibbonProps {
  /** How many strands converge. */
  strands?: number;
  /** 0 to 1. Drives how much of each strand is drawn. */
  progress?: number;
  className?: string;
  /** Reverses the taper so strands fan out from a single point instead. */
  direction?: "converge" | "fan";
}

/**
 * The ribbon that gathers scattered fragments into one thread.
 *
 * Uses `preserveAspectRatio="none"` so the shape stretches to whatever box it's
 * given, with `vector-effect="non-scaling-stroke"` keeping the stroke weight
 * even under that non-uniform scale. `pathLength="1"` makes `progress` map
 * directly onto the dash offset.
 */
export function ThreadRibbon({
  strands = 6,
  progress = 1,
  className,
  direction = "converge",
}: ThreadRibbonProps) {
  const clamped = Math.min(1, Math.max(0, progress));

  const paths = Array.from({ length: strands }, (_, i) => {
    // Spread the loose ends evenly across the top edge.
    const spread = strands === 1 ? 50 : 6 + (88 / (strands - 1)) * i;
    const start = direction === "converge" ? spread : 50;
    const end = direction === "converge" ? 50 : spread;
    return {
      key: i,
      d: `M${start} 0 C ${start} 42, ${end} 58, ${end} 100`,
      // Outer strands travel further, so they start a little sooner.
      delay: Math.abs(spread - 50) * 3,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      {paths.map(({ key, d, delay }) => (
        <path
          key={key}
          d={d}
          pathLength="1"
          fill="none"
          stroke="var(--thread)"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="1"
          strokeDashoffset={1 - clamped}
          opacity={0.16 + clamped * 0.34}
          style={{
            transition: `stroke-dashoffset 900ms var(--ease-continuity) ${delay}ms, opacity 700ms var(--ease-continuity)`,
          }}
        />
      ))}
    </svg>
  );
}
