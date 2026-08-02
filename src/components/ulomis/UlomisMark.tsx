/* eslint-disable prettier/prettier */
import { useId } from "react";
import { cn } from "@/lib/utils";

export type UlomisState =
  | "idle"
  | "attentive"
  | "holding"
  | "confirmed"
  | "open"
  | "correction"
  | "fragmented"
  | "gathering"
  | "connecting"
  | "restored"
  | "uncertain"
  | "contradicted"
  | "corrected"
  | "continued"
  | "completed"
  | "no-match";

const stateAccent: Record<UlomisState, string> = {
  idle: "var(--thread)",
  attentive: "var(--thread)",
  holding: "var(--sky)",
  confirmed: "var(--confirmed)",
  open: "var(--openloop)",
  correction: "var(--correction)",
  fragmented: "var(--sky)",
  gathering: "var(--thread)",
  connecting: "var(--thread)",
  restored: "var(--confirmed)",
  uncertain: "var(--openloop)",
  contradicted: "var(--correction)",
  corrected: "var(--confirmed)",
  continued: "var(--thread)",
  completed: "var(--confirmed)",
  "no-match": "var(--muted-foreground)",
};

export const ulomisStateLabel: Record<UlomisState, string> = {
  idle: "Resting",
  attentive: "Attentive",
  holding: "Holding the thread",
  confirmed: "Confirmed",
  open: "Open loop",
  correction: "Needs correction",
  fragmented: "The thread is fragmented",
  gathering: "Inspecting the fragments",
  connecting: "Connecting relevant evidence",
  restored: "The thread is restored",
  uncertain: "One connection needs confirmation",
  contradicted: "The sources disagree",
  corrected: "The thread has been corrected",
  continued: "Continuing from the restored state",
  completed: "The thread is complete",
  "no-match": "No reliable thread was found",
};

const ulomisStateLabelAr: Record<UlomisState, string> = {
  idle: "في حالة هدوء",
  attentive: "منتبه",
  holding: "يحفظ الخيط",
  confirmed: "مؤكد",
  open: "خيط مفتوح",
  correction: "يحتاج إلى تصحيح",
  fragmented: "الخيط متجزئ",
  gathering: "يفحص الأجزاء",
  connecting: "يربط الأدلة ذات الصلة",
  restored: "تمت استعادة الخيط",
  uncertain: "رابط واحد يحتاج إلى تأكيد",
  contradicted: "المصادر متعارضة",
  corrected: "تم تصحيح الخيط",
  continued: "تتم المتابعة من الحالة المستعادة",
  completed: "اكتمل الخيط",
  "no-match": "لم يتم العثور على خيط موثوق",
};

interface UlomisMarkProps {
  state?: UlomisState;
  eyes?: boolean;
  size?: number | string;
  className?: string;
  title?: string;
  tail?: boolean;
  language?: "en" | "ar";
}

export function UlomisMark({
  state = "idle",
  eyes = false,
  size = 96,
  className,
  title,
  tail = false,
  language = "en",
}: UlomisMarkProps) {
  const accent = stateAccent[state];
  const rawId = useId().replace(/:/g, "");
  const gradientId = `ulomis-core-${rawId}`;
  const isFragmented = state === "fragmented" || state === "no-match";
  const isConnecting = state === "connecting" || state === "gathering";
  const isSplit = state === "contradicted";
  const isDimmed = state === "uncertain";
  const isClosed = state === "completed";
  const isCorrected = state === "corrected" || state === "restored" || state === "confirmed";
  const stateLabel = language === "ar" ? ulomisStateLabelAr[state] : ulomisStateLabel[state];

  return (
    <svg
      viewBox="0 0 148 120"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `${language === "ar" ? "أولوميس" : "Ulomis"} — ${stateLabel}`}
      className={cn("shrink-0 overflow-visible", className)}
      style={{ color: accent }}
    >
      <title>{title ?? `${language === "ar" ? "أولوميس" : "Ulomis"} — ${stateLabel}`}</title>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={isDimmed ? 0.48 : 1} />
          <stop offset="70%" stopColor="currentColor" stopOpacity={isDimmed ? 0.18 : 0.35} />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={cn(isConnecting && "ulomis-connecting", state === "continued" && "ulomis-continued")}>
        <path
          d={
            isClosed
              ? "M60 10c27.6 0 50 22.4 50 50s-22.4 50-50 50S10 87.6 10 60 32.4 10 60 10Z"
              : "M60 10c27.6 0 50 22.4 50 50s-22.4 50-50 50S10 87.6 10 60c0-20.2 12-37.6 29.3-45.4"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={isFragmented ? "60 18 38 22 90" : undefined}
          opacity={state === "no-match" ? 0.52 : 0.92}
        />
        <path
          d="M39.3 14.6c6.4 3.6 9 9 7.6 15.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity={isFragmented ? 0.15 : 0.35}
        />

        {(tail || state === "continued" || state === "connecting") && (
          <path
            d="M105 88c14 10 22 12 34 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.48"
          />
        )}

        {isSplit && (
          <>
            <path
              d="M97 27c16-13 28-10 42-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.78"
            />
            <path
              d="M103 40c16 1 27 10 35 22"
              fill="none"
              stroke="var(--openloop)"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.82"
            />
          </>
        )}
      </g>

      <circle
        cx="60"
        cy="60"
        r="26"
        fill={`url(#${gradientId})`}
        className={cn(
          (state === "attentive" || state === "open" || state === "uncertain") &&
            "ulomis-core-pulse",
        )}
      />
      <circle cx="60" cy="60" r={isCorrected ? 9 : 8} fill="currentColor" opacity={isDimmed ? 0.56 : 1} />

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
      {caption && <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
