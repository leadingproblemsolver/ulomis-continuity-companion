import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UlomisMark } from "./UlomisMark";
import { UButton } from "./Button";
import { useTheme } from "./theme";
import { useLocale, LOCALE_LABEL, LOCALE_CODE, LOCALE_FLAG, type Locale } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const nav: { href: string; label: Record<Locale, string> }[] = [
  { href: "#how-it-works", label: { en: "How it works", ar: "كيف يعمل" } },
  { href: "#journey", label: { en: "Examples", ar: "أمثلة" } },
  { href: "#trust", label: { en: "Trust", ar: "الثقة" } },
];

/**
 * Ulomis isn't open yet, so "Log in" has nowhere honest to go. Rather than a
 * dead route, it says so and points at the only door that exists.
 */
function useLoginNotice(locale: Locale) {
  return () => {
    track("ulomis_cta_clicked", { cta: "login" });
    toast(locale === "ar" ? "أولوميس لم يُفتح بعد" : "Ulomis isn't open yet", {
      description:
        locale === "ar"
          ? "لا يوجد شيء لتسجّل الدخول إليه الآن — الوصول المبكر يُفتح أولاً."
          : "There's nothing to log into for now — early access opens first.",
      action: {
        label: locale === "ar" ? "انضم مبكراً" : "Join early",
        onClick: () =>
          document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" }),
      },
    });
  };
}

const LOCALES: Locale[] = ["en", "ar"];

/**
 * A visible two-way switch rather than a single icon that cycles and forces
 * a guess at what it currently means — both languages are always on screen,
 * flag plus code, with the active one unmistakably filled in.
 */
function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={`${LOCALE_LABEL.en} / ${LOCALE_LABEL.ar}`}
      className="flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              if (active) return;
              track("ulomis_locale_changed", { to: code });
              setLocale(code);
            }}
            aria-pressed={active}
            aria-label={LOCALE_LABEL[code]}
            className={cn(
              "focus-ring flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span aria-hidden className="text-sm leading-none">
              {LOCALE_FLAG[code]}
            </span>
            {/* Flags alone stay unambiguous below ~400px; the code returns once there's room. */}
            <span className="hidden min-[400px]:inline">{LOCALE_CODE[code]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const onLogin = useLoginNotice(locale);

  const loginLabel = locale === "ar" ? "تسجيل الدخول" : "Log in";
  const joinLabel = locale === "ar" ? "انضم مبكراً" : "Join early access";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <UlomisMark size={30} state="idle" decorative />
          <span className="truncate font-display text-base font-semibold tracking-tight">
            Ulomis
          </span>
        </Link>

        <nav className="ms-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label[locale]}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 lg:ms-3 lg:gap-2">
          <LanguageToggle />

          <UButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </UButton>

          <UButton
            variant="link"
            size="sm"
            className="hidden text-muted-foreground sm:inline-flex"
            onClick={onLogin}
          >
            {loginLabel}
          </UButton>

          <UButton
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
            onClick={() =>
              track("ulomis_cta_clicked", { cta: "join_early_access", placement: "header" })
            }
          >
            <a href="#early-access">{joinLabel}</a>
          </UButton>

          <UButton
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </UButton>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden border-t border-border/70 transition-all duration-300 lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent",
        )}
      >
        <nav className="min-h-0">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.label[locale]}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#early-access"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
              >
                {joinLabel}
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogin();
                }}
                className="block w-full rounded-xl px-3 py-2.5 text-start text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {loginLabel}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
