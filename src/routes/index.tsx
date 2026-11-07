/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/ulomis/Header";
import { JourneyDemo } from "@/components/ulomis/JourneyDemo";
import type { Language } from "@/components/ulomis/journey-data";
import { trackEvent } from "@/lib/analytics";

const TITLE = "Ulomis — Return without starting over";
const DESCRIPTION =
  "Ulomis restores the decisions, changes, open questions, and next action behind an unfinished thread.";
const LANGUAGE_KEY = "ulomis-language";

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
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LANGUAGE_KEY);
      if (saved === "ar" || saved === "en") setLanguage(saved);
    } catch {
      // Language remains usable even when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // Do not block the bilingual experience when persistence is unavailable.
    }
  }, [language]);

  function changeLanguage(next: Language) {
    setLanguage(next);
    trackEvent("language_changed", { language: next });
  }

  return (
    <div className="min-h-screen bg-background" data-language={language}>
      <Header language={language} onLanguageChange={changeLanguage} />
      <main>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">{language === "ar" ? "هل لديك مشروع ناشئ لم يكتمل؟" : "Have an unfinished startup thread?"}</p>
          <a href="/founder" className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">
            {language === "ar" ? "جرّب استمرارية المؤسس" : "Try Founder Continuity →"}
          </a>
        </div>
        <JourneyDemo language={language} />
      </main>
    </div>
  );
}
