import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UlomisMark } from "./UlomisMark";
import { UButton } from "./Button";
import { useTheme } from "./theme";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const nav = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Examples", href: "#demo" },
  { label: "Trust", href: "#trust" },
];

/**
 * Ulomis isn't open yet, so "Log in" has nowhere honest to go. Rather than a
 * dead route, it says so and points at the only door that exists.
 */
function useLoginNotice() {
  return () => {
    track("ulomis_cta_clicked", { cta: "login" });
    toast("Ulomis isn't open yet", {
      description: "There's nothing to log into for now — early access opens first.",
      action: {
        label: "Join early",
        onClick: () =>
          document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" }),
      },
    });
  };
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const onLogin = useLoginNotice();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <UlomisMark size={30} state="idle" decorative />
          <span className="truncate font-display text-base font-semibold tracking-tight">
            Ulomis
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-3 lg:gap-2">
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
            Log in
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
            <a href="#early-access">Join early access</a>
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
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#early-access"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
              >
                Join early access
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogin();
                }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Log in
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
