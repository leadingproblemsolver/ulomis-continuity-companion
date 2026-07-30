import { cn } from "@/lib/utils";

export type UlomisState = "idle" | "attentive" | "holding" | "confirmed" | "open" | "correction";

const stateAccent: Record<UlomisState, string> = {
  idle: "var(--thread)",
  attentive: "var(--thread)",
  holding: "var(--sky)",
  confirmed: "var(--confirmed)",
  open: "var(--openloop)",
  correction: "var(--correction)",
};

export const ulomisStateLabel: Record<UlomisState, string> = {
  idle: "Resting",
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
}

/**
 * Ulomis: one continuous ribbon, a calm rounded silhouette, a small central
 * light. No mouth, no robot parts. Eyes only when they carry meaning.
 */
export function UlomisMark({
  state = "idle",
  eyes = false,
  size = 96,
  className,
  title,
  tail = false,
}: UlomisMarkProps) {
  const accent = stateAccent[state];

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `Ulomis — ${ulomisStateLabel[state]}`}
      className={cn("shrink-0 overflow-visible", className)}
      style={{ color: accent }}
    >
      <title>{title ?? `Ulomis — ${ulomisStateLabel[state]}`}</title>
      <defs>
        <radialGradient id={`ulomis-core-${state}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the single ribbon */}
      <path
        d="M60 10c27.6 0 50 22.4 50 50s-22.4 50-50 50S10 87.6 10 60c0-20.2 12-37.6 29.3-45.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.92"
      />
      {/* inner return of the same ribbon, keeping the loop continuous */}
      <path
        d="M39.3 14.6c6.4 3.6 9 9 7.6 15.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.35"
      />

      {tail && (
        <path
          d="M105 88c14 10 22 12 34 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.4"
        />
      )}

      {/* central light */}
      <circle
        cx="60"
        cy="60"
        r="26"
        fill={`url(#ulomis-core-${state})`}
        style={{
          transformOrigin: "60px 60px",
          animation:
            state === "attentive" || state === "open"
              ? "ulomis-pulse 3.2s var(--ease-continuity) infinite"
              : undefined,
        }}
      />
      <circle cx="60" cy="60" r="8" fill="currentColor" />

      {eyes && (
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
