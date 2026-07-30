import { Section } from "@/components/ulomis/Section";
import { Reveal } from "@/components/ulomis/Reveal";
import { UlomisMark } from "@/components/ulomis/UlomisMark";

export function Philosophy() {
  return (
    <Section id="philosophy" tone="deep" width="narrow" align="center">
      <Reveal className="flex flex-col items-center text-center">
        <UlomisMark size={64} state="holding" decorative />
        <p className="mt-8 font-display text-2xl leading-[1.2] font-semibold text-balance sm:text-4xl">
          The next evolution of computing is not more apps.
          <span className="mt-2 block text-gradient-thread">It is continuity between them.</span>
        </p>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
          Every app you use is excellent at holding its own contents and blind to everything
          happening beside it. You are the only thing connecting them, and you do it from memory,
          every single time. That is the work Ulomis is meant to take back.
        </p>
      </Reveal>
    </Section>
  );
}
