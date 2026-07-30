import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";
import { UCard } from "@/components/ulomis/Card";

const status = [
  {
    title: "What you just used is a simulation",
    body: "The demo runs on written scenarios, not on your data. Nothing was read, connected, or inferred — it shows the experience Ulomis is aiming at, honestly labelled as a preview of it.",
  },
  {
    title: "There are no integrations yet",
    body: "Ulomis does not connect to any app today. The fragments in the demo are deliberately generic for that reason: naming products we haven't integrated with would be a claim, not a preview.",
  },
  {
    title: "There are no numbers on this page",
    body: "No user counts, no time-saved figures, no testimonials, no logos. An early product that quotes metrics is quoting someone else's. When there is real evidence, it will appear here.",
  },
  {
    title: "Early access is the actual ask",
    body: "We're finding out whether losing continuity is a problem people recognise strongly enough to want solved. Joining is a signal, and right now the signal is the product.",
  },
];

export function EvidenceStatus() {
  return (
    <Section
      id="evidence"
      eyebrow="Where this actually stands"
      title="An honest status report"
      lede="You should know exactly how much of this exists before you decide whether to care about it."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {status.map((item, index) => (
          <Reveal as="li" key={item.title} delay={index * 90}>
            <UCard variant="outline" padding="lg" className="h-full">
              <h3 className="text-base leading-snug font-semibold">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </UCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
