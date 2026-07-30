import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";
import { UCard } from "@/components/ulomis/Card";

const moments = [
  {
    said: "Where was that thing?",
    meaning: "The information exists. What's missing is the path back to it.",
  },
  {
    said: "What did I decide?",
    meaning: "You settled this once already. The conclusion didn't survive the gap.",
  },
  {
    said: "Didn't I already research this?",
    meaning: "You did. The reading is gone, so the reading happens again.",
  },
  {
    said: "Why am I starting over?",
    meaning: "Because nothing held the middle of the work while you were away.",
  },
];

export function ProblemRecognition() {
  return (
    <Section
      id="problem"
      eyebrow="Problem recognition"
      title={
        <>
          You are not forgetting information.
          <span className="mt-1 block text-muted-foreground">You are losing continuity.</span>
        </>
      }
      lede="Everything is still saved. The file is there, the thread is there, the tab is probably still open. What's gone is the shape of what you were doing — and that's the part you have to rebuild by hand every time."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {moments.map((moment, index) => (
          <Reveal as="li" key={moment.said} delay={index * 90}>
            <UCard variant="quiet" padding="lg" className="h-full">
              <p className="font-display text-lg leading-snug font-semibold text-balance sm:text-xl">
                “{moment.said}”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{moment.meaning}</p>
            </UCard>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
