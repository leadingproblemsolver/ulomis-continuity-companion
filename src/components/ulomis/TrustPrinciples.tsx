import { UCard } from "./Card";
import { cn } from "@/lib/utils";

export interface TrustPrinciple {
  title: string;
  body: string;
}

export const defaultPrinciples: TrustPrinciple[] = [
  {
    title: "It keeps a thread, not a profile",
    body: "Ulomis holds the shape of what you were doing so you can resume it. It does not build a picture of who you are.",
  },
  {
    title: "Nothing is asserted that you didn't say",
    body: "Settled points, open loops, and corrections come from the thread itself. Ulomis does not invent the middle.",
  },
  {
    title: "Corrections stay visible",
    body: "When something changed, the change is shown rather than quietly overwritten. You can see what you decided against.",
  },
  {
    title: "You end the thread",
    body: "A thread closes when you close it. Continuity is something you keep, not something kept on you.",
  },
];

export function TrustPrinciples({
  principles = defaultPrinciples,
  className,
}: {
  principles?: TrustPrinciple[];
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {principles.map((p, i) => (
        <li key={p.title}>
          <UCard variant="quiet" padding="lg" className="h-full">
            <p className="font-display text-sm font-semibold text-primary">
              {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-base font-semibold leading-snug">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </UCard>
        </li>
      ))}
    </ol>
  );
}
