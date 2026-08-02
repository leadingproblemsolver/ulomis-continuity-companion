/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { Languages, Moon, Sun } from "lucide-react";
import { UlomisMark } from "./UlomisMark";
import { UButton } from "./Button";
import { useTheme } from "./theme";
import type { Language } from "./journey-data";

export function Header({
  language,
  onLanguageChange,
}: {
  language: Language;
  onLanguageChange: (language: Language) => void;
}) {
  const { theme, toggleTheme } = useTheme();
  const isArabic = language === "ar";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <UlomisMark size={30} state="idle" language={language} />
          <span className="truncate font-display text-base font-semibold tracking-tight">Ulomis</span>
          <span className="hidden text-sm text-muted-foreground sm:inline" dir="rtl">
            أولوميس
          </span>
        </Link>

        <div className="ms-auto flex items-center gap-1.5">
          <div
            className="flex items-center rounded-full border border-border bg-surface p-1"
            aria-label={isArabic ? "اختيار اللغة" : "Language selection"}
          >
            <Languages className="mx-2 size-4 text-muted-foreground" aria-hidden />
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              aria-pressed={language === "en"}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("ar")}
              aria-pressed={language === "ar"}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              dir="rtl"
            >
              العربية
            </button>
          </div>

          <UButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? isArabic
                  ? "التبديل إلى الوضع الفاتح"
                  : "Switch to light mode"
                : isArabic
                  ? "التبديل إلى الوضع الداكن"
                  : "Switch to dark mode"
            }
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </UButton>

          <UButton variant="primary" size="sm" className="hidden md:inline-flex" asChild>
            <a href="#demo">{isArabic ? "استعد خيطًا" : "Restore a thread"}</a>
          </UButton>
        </div>
      </div>
    </header>
  );
}
