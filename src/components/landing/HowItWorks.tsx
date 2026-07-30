import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";

const steps = [
  {
    title: "You stop, the way people actually stop",
    body: "Mid-sentence, mid-comparison, mid-decision. No wrapping up, no writing a handover note to yourself, no tidying first.",
  },
  {
    title: "Ulomis keeps the thread",
    body: "It holds the shape of what was happening: what you had settled, what you had left open, and what you had already changed your mind about.",
  },
  {
    title: "You come back and it is still there",
    body: "Not a summary of everything you touched. The four things that let you resume — where you are, what you decided, what is unresolved, and what comes next.",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      tone="quiet"
      eyebrow="How it works"
      title="Three moments, and only one of them is yours"
      lede="Ulomis has no workflow to adopt. The whole mechanism sits in the gap between stopping and starting again."
    >
      <ol className="grid gap-6 sm:grid-cols-3">
        {steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 120}>
            <div className="h-full">
              <span aria-hidden className="thread-rule mb-5 block w-12" />
              <p className="font-display text-sm font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg leading-snug font-semibold">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
