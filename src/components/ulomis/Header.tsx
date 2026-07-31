import { Link } from "@tanstack/react-router";
import { Globe, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UlomisMark } from "./UlomisMark";
import { UButton } from "./Button";
import { useTheme } from "./theme";
import { useLocale, LOCALE_LABEL, type Locale } from "@/lib/i18n";
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

function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const next: Locale = locale === "en" ? "ar" : "en";

  return (
    <UButton
      variant="ghost"
      size="sm"
      onClick={() => {
        track("ulomis_locale_changed", { to: next });
        setLocale(next);
      }}
      aria-label={`${LOCALE_LABEL.en} | ${LOCALE_LABEL.ar}`}
      className="gap-1.5 text-muted-foreground"
    >
      <Globe className="size-4" />
      <span className="hidden sm:inline">{LOCALE_LABEL[next]}</span>
    </UButton>
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
