import { principles as defaultPrinciples, type TrustPrinciple } from "@/data/principles";
import { Reveal } from "./Reveal";
import { UCard } from "./Card";
import { cn } from "@/lib/utils";

export type { TrustPrinciple };

export function TrustPrinciples({
  principles = defaultPrinciples,
  className,
}: {
  principles?: TrustPrinciple[];
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {principles.map((principle, index) => (
        <Reveal as="li" key={principle.title} delay={index * 80}>
          <UCard variant="quiet" padding="lg" className="h-full">
            <p className="font-display text-sm font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-base leading-snug font-semibold">{principle.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
          </UCard>
        </Reveal>
      ))}
    </ol>
  );
}
