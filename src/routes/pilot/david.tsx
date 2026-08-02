import { createFileRoute } from "@tanstack/react-router";
import { PilotFlow } from "@/components/ulomis/pilot/PilotFlow";

const TITLE = "Ulomis live-thread pilot — David";
const DESCRIPTION =
  "A founder-assisted, source-backed test of whether Ulomis reduces re-entry and administrative reconstruction on one live client thread.";

export const Route = createFileRoute("/pilot/david")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PilotFlow,
});
