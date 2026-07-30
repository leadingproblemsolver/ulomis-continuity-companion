import { Section } from "@/components/ulomis/Section";
import { TrustPrinciples } from "@/components/ulomis/TrustPrinciples";

export function TrustSection() {
  return (
    <Section
      id="trust"
      eyebrow="Trust"
      title={
        <>
          Ulomis holds the thread.
          <span className="mt-1 block text-muted-foreground">You control it.</span>
        </>
      }
      lede="Something that keeps the unfinished parts of your life has to be legible about how it behaves. These are commitments about behaviour, not claims about infrastructure."
    >
      <TrustPrinciples />
    </Section>
  );
}
