import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/ulomis/Header";
import { Footer } from "@/components/ulomis/Footer";
import { MobileCta } from "@/components/ulomis/MobileCta";
import { Section } from "@/components/ulomis/Section";
import { Hero } from "@/components/landing/Hero";
import { ProblemRecognition } from "@/components/landing/ProblemRecognition";
import { CategoryShift } from "@/components/landing/CategoryShift";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { Philosophy } from "@/components/landing/Philosophy";
import { EvidenceStatus } from "@/components/landing/EvidenceStatus";
import { EarlyAccess } from "@/components/landing/EarlyAccess";
import { ContinuityDemo } from "@/components/demo/ContinuityDemo";
import { trackOnce } from "@/lib/analytics";

const TITLE = "Ulomis — Your digital life, continued.";
const DESCRIPTION =
  "Ulomis is a continuity companion. Return to a plan, project, conversation, or responsibility without reconstructing everything from memory.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => trackOnce("ulomis_viewed"), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <Hero />
        <ProblemRecognition />
        <CategoryShift />

        <Section
          id="demo"
          eyebrow="Interactive preview"
          title="Where should Ulomis begin?"
          lede="Pick a part of your life, then let Ulomis restore the thread. Nothing to sign up for — this runs on written scenarios, not on your data."
        >
          <ContinuityDemo />
        </Section>

        <Benefits />
        <HowItWorks />
        <TrustSection />
        <Philosophy />
        <EvidenceStatus />
        <EarlyAccess />
      </main>

      <Footer />
      <MobileCta />
    </div>
  );
}
