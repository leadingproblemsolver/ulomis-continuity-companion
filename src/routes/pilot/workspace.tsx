import { createFileRoute } from "@tanstack/react-router";
import { FounderWorkspace } from "@/components/ulomis/pilot/FounderWorkspace";

export const Route = createFileRoute("/pilot/workspace")({
  head: () => ({
    meta: [
      { title: "Ulomis pilot operator workspace" },
      { name: "description", content: "Local founder workspace for preparing a source-backed Ulomis continuity file." },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: FounderWorkspace,
});
