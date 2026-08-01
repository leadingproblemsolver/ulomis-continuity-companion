import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/ulomis/Header";
import { Footer } from "@/components/ulomis/Footer";
import { MobileCta } from "@/components/ulomis/MobileCta";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrustSection } from "@/components/landing/TrustSection";
import { Philosophy } from "@/components/landing/Philosophy";
import { EvidenceStatus } from "@/components/landing/EvidenceStatus";
import { EarlyAccess } from "@/components/landing/EarlyAccess";
import { RestorationJourney } from "@/components/journey/RestorationJourney";
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
  useEffect(() => trackOnce("landing_viewed"), []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/*
          Scenes 1-7 of the guided restoration journey: recognition, the
          scattered thread, restoring it, the delta, the correction/trust
          test, and choosing what happens next. This replaces what used to be
          a hero + three separate marketing sections — the product has to be
          felt before it's explained, not the other way around.
        */}
        <div id="journey">
          <RestorationJourney />
        </div>

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
