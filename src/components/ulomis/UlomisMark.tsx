import { useId } from "react";
import { cn } from "@/lib/utils";

export type UlomisState =
  "idle" | "forming" | "attentive" | "holding" | "confirmed" | "open" | "correction";

const stateAccent: Record<UlomisState, string> = {
  idle: "var(--thread)",
  forming: "var(--sky)",
  attentive: "var(--thread)",
  holding: "var(--sky)",
  confirmed: "var(--confirmed)",
  open: "var(--openloop)",
  correction: "var(--correction)",
};

export const ulomisStateLabel: Record<UlomisState, string> = {
  idle: "Resting",
  forming: "Forming",
  attentive: "Attentive",
  holding: "Holding the thread",
  confirmed: "Confirmed",
  open: "Open loop",
  correction: "Needs correction",
};

interface UlomisMarkProps {
  state?: UlomisState;
  eyes?: boolean;
  size?: number | string;
  className?: string;
  title?: string;
  /** Draw the ribbon tail that connects out to interface fragments. */
  tail?: boolean;
  /**
   * How much of the ribbon is drawn, 0 to 1. Below 1 Ulomis reads as partially
   * formed — used in the hero and before the demo restores a thread.
   */
  progress?: number;
  /** Hides the mark from assistive tech when it sits beside its own label. */
  decorative?: boolean;
}

/**
 * Ulomis: one continuous ribbon, a calm rounded silhouette, a small central
 * light. No mouth, no robot parts. Eyes only when they carry meaning.
 *
 * The ribbon paths declare `pathLength="1"`, so `progress` maps straight onto
 * `strokeDashoffset` without measuring geometry at runtime.
 */
export function UlomisMark({
  state = "idle",
  eyes = false,
  size = 96,
  className,
  title,
  tail = false,
  progress = 1,
  decorative = false,
}: UlomisMarkProps) {
  const accent = stateAccent[state];
  const uid = useId().replace(/:/g, "");
  const clamped = Math.min(1, Math.max(0, progress));
  const label = title ?? `Ulomis — ${ulomisStateLabel[state]}`;

  // The core light only reaches full presence once the ribbon has closed.
  const coreScale = 0.55 + clamped * 0.45;
  const pulses = state === "attentive" || state === "open";

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn("shrink-0 overflow-visible", className)}
      style={{ color: accent, transition: "color 600ms var(--ease-continuity)" }}
    >
      {!decorative && <title>{label}</title>}
      <defs>
        <radialGradient id={`ulomis-core-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the single ribbon */}
      <path
        d="M60 10c27.6 0 50 22.4 50 50s-22.4 50-50 50S10 87.6 10 60c0-20.2 12-37.6 29.3-45.4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.92"
        strokeDasharray="1"
        strokeDashoffset={1 - clamped}
        style={{ transition: "stroke-dashoffset 1.1s var(--ease-continuity)" }}
      />
      {/* inner return of the same ribbon, keeping the loop continuous */}
      <path
        d="M39.3 14.6c6.4 3.6 9 9 7.6 15.4"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.35"
        strokeDasharray="1"
        strokeDashoffset={1 - clamped}
        style={{ transition: "stroke-dashoffset 1.1s var(--ease-continuity) 120ms" }}
      />

      {tail && (
        <path
          d="M105 88c14 10 22 12 34 12"
          pathLength="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.4"
          strokeDasharray="1"
          strokeDashoffset={1 - clamped}
          style={{ transition: "stroke-dashoffset 900ms var(--ease-continuity) 260ms" }}
        />
      )}

      {/* central light */}
      <circle
        cx="60"
        cy="60"
        r="26"
        fill={`url(#ulomis-core-${uid})`}
        opacity={clamped}
        style={{
          transformOrigin: "60px 60px",
          transform: `scale(${coreScale})`,
          transition:
            "opacity 700ms var(--ease-continuity), transform 700ms var(--ease-continuity)",
          animation: pulses ? "ulomis-pulse 3.2s var(--ease-continuity) infinite" : undefined,
        }}
      />
      <circle
        cx="60"
        cy="60"
        r="8"
        fill="currentColor"
        opacity={clamped}
        style={{ transition: "opacity 700ms var(--ease-continuity)" }}
      />

      {eyes && clamped > 0.9 && (
        <g fill="var(--background)" opacity="0.92">
          <rect x="45" y="52" width="6" height="12" rx="3" />
          <rect x="69" y="52" width="6" height="12" rx="3" />
        </g>
      )}
    </svg>
  );
}

interface UlomisAvatarProps extends UlomisMarkProps {
  caption?: string;
}

export function UlomisAvatar({ caption, className, ...props }: UlomisAvatarProps) {
  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <div className="rounded-full bg-accent/60 p-4">
        <UlomisMark {...props} />
      </div>
      {caption && (
        <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
