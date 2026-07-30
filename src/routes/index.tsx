import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/ulomis/Header";
import { Section } from "@/components/ulomis/Section";
import { UButton } from "@/components/ulomis/Button";
import { UCard, UCardHeader } from "@/components/ulomis/Card";
import { UlomisMark } from "@/components/ulomis/UlomisMark";
import { ScenarioSelector } from "@/components/ulomis/ScenarioSelector";
import { ContinuityOutput } from "@/components/ulomis/ContinuityOutput";
import { TrustPrinciples } from "@/components/ulomis/TrustPrinciples";
import { ThreadForm } from "@/components/ulomis/ThreadForm";
import { threads } from "@/components/ulomis/threads";

const TITLE = "Ulomis — Your digital life, continued.";
const DESCRIPTION =
  "Ulomis is a continuity companion. Come back to a plan, project, conversation, or responsibility without reconstructing it from memory.";

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

const notList = [
  "an assistant",
  "a chatbot",
  "a second brain",
  "a task manager",
  "a productivity coach",
];

const holds = [
  {
    title: "What was already settled",
    body: "The decisions you don't need to make twice, kept where you left them.",
  },
  {
    title: "What stayed open",
    body: "The loop you didn't close, written the way you were thinking about it.",
  },
  {
    title: "What you corrected",
    body: "The turn you took, so an old version never quietly comes back.",
  },
];

function Index() {
  const [activeId, setActiveId] = useState(threads[0].id);
  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: "var(--gradient-veil)" }}
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />A continuity companion for your
                digital life
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.05] sm:text-6xl">
                Your digital life,{" "}
                <span className="text-gradient-thread">continued.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                You stop mid-thought. Days pass. Ulomis keeps the thread — so returning to a plan, a
                project, a conversation, or a responsibility doesn't start with rebuilding it from
                memory.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <UButton size="lg" variant="thread" asChild>
                  <a href="#thread">Keep a thread</a>
                </UButton>
                <UButton size="lg" variant="outline" asChild>
                  <a href="#scenarios">See it pick one up</a>
                </UButton>
              </div>
              <p className="mt-8 text-sm text-muted-foreground">
                Ulomis is not {notList.slice(0, -1).join(", ")}, or {notList.at(-1)}.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-sky/20 blur-2xl" aria-hidden />
                <UlomisMark
                  size="min(72vw, 320px)"
                  state="holding"
                  eyes
                  tail
                  className="relative"
                  title="Ulomis, holding the thread"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What it holds */}
        <Section
          id="continuity"
          eyebrow="Ulomis keeps the thread"
          title="Continuity is the whole product"
          lede="Not a summary of everything. The three things that let you resume: what's settled, what's open, and what changed."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {holds.map((item, i) => (
              <UCard key={item.title} variant="plain" padding="lg" interactive>
                <UCardHeader
                  icon={
                    <UlomisMark
                      size={22}
                      state={(["confirmed", "open", "correction"] as const)[i]}
                    />
                  }
                  title={item.title}
                  description={item.body}
                />
              </UCard>
            ))}
          </div>
        </Section>

        {/* Scenarios */}
        <Section
          id="scenarios"
          tone="quiet"
          eyebrow="Scenarios"
          title="Pick something you left unfinished"
          lede="Same companion, same shape of answer, whatever the thread happens to be."
        >
          <ScenarioSelector threads={threads} value={activeId} onChange={setActiveId} />
          <div className="mt-6">
            <ContinuityOutput thread={active} />
          </div>
        </Section>

        {/* Principles */}
        <Section
          id="principles"
          eyebrow="Trust principles"
          title="What Ulomis will and won't do"
          lede="A companion that holds your unfinished work has to be legible about how it behaves."
        >
          <TrustPrinciples />
        </Section>

        {/* Form */}
        <Section
          id="thread"
          tone="quiet"
          eyebrow="Try the shape of it"
          title="Leave a thread now, pick it up later"
          lede="Nothing here leaves your browser — this is the interaction, not an account."
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <ThreadForm />
            <UCard variant="plain" padding="lg" className="h-fit">
              <UCardHeader
                eyebrow="Ulomis states"
                title="One ribbon, a few moods"
                description="The mascot is the status. Colour carries meaning; the silhouette never changes."
              />
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {(
                  [
                    ["idle", "Resting"],
                    ["attentive", "Attentive"],
                    ["holding", "Holding"],
                    ["confirmed", "Settled"],
                    ["open", "Open loop"],
                    ["correction", "Corrected"],
                  ] as const
                ).map(([state, label]) => (
                  <li key={state} className="flex flex-col items-center gap-2 text-center">
                    <UlomisMark size={48} state={state} eyes={state === "attentive"} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </li>
                ))}
              </ul>
            </UCard>
          </div>
        </Section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <UlomisMark size={26} state="idle" />
            <span className="font-display text-sm font-semibold">Ulomis</span>
            <span className="text-sm text-muted-foreground" dir="rtl">
              أولوميس
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Your digital life, continued.</p>
        </div>
      </footer>
    </div>
  );
}
