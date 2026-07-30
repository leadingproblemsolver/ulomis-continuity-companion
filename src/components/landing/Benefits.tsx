import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";
import { UlomisMark, type UlomisState } from "@/components/ulomis/UlomisMark";
import { UCard } from "@/components/ulomis/Card";

/**
 * Deliberately not a feature grid. Each item is stated as the return you get —
 * the fragmentation it removes — rather than a capability the software has.
 */
const returns: { state: UlomisState; before: string; after: string }[] = [
  {
    state: "confirmed",
    before: "You re-open six things to remember where you were.",
    after: "You open one thread and the position is already stated.",
  },
  {
    state: "holding",
    before: "A decision you made carefully quietly reverts, because nothing held it.",
    after: "The decision comes back with you, and so does the reason for it.",
  },
  {
    state: "open",
    before: "The thing you left unfinished is the thing you forget entirely.",
    after: "What stayed open is named, so it doesn't survive on memory alone.",
  },
  {
    state: "correction",
    before: "An old version creeps back because nobody recorded that you'd moved on.",
    after: "Corrections stay visible, so what you ruled out stays ruled out.",
  },
];

export function Benefits() {
  return (
    <Section
      id="benefits"
      eyebrow="What changes"
      title="The work of restarting disappears"
      lede="Not more capability. Less reconstruction — the twenty minutes at the start of every session that you never chose to spend."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {returns.map((item, index) => (
          <Reveal as="li" key={item.after} delay={index * 90}>
            <UCard variant="plain" padding="lg" className="h-full" interactive>
              <div className="flex gap-4">
                <UlomisMark size={30} state={item.state} decorative className="mt-1" />
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-muted-foreground line-through decoration-border decoration-2">
                    {item.before}
                  </p>
                  <p className="mt-3 leading-relaxed font-medium">{item.after}</p>
                </div>
              </div>
            </UCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
