import { useEffect, useState } from "react";
import { UButton } from "./Button";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Persistent mobile CTA.
 *
 * Appears once the hero's own buttons have scrolled away and hides again over
 * the early-access section, so it never covers the form it points at.
 */
export function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("early-access");
    const hero = document.getElementById("problem");
    if (!hero || typeof IntersectionObserver === "undefined") return;

    let pastHero = false;
    let atForm = false;
    const sync = () => setVisible(pastHero && !atForm);

    // `boundingClientRect.top < 0` means the element has scrolled above the fold.
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        pastHero = entry.isIntersecting || entry.boundingClientRect.top < 0;
        sync();
      },
      { threshold: 0 },
    );
    heroObserver.observe(hero);

    const formObserver = target
      ? new IntersectionObserver(
          ([entry]) => {
            atForm = entry.isIntersecting;
            sync();
          },
          { threshold: 0.15 },
        )
      : null;
    if (target && formObserver) formObserver.observe(target);

    return () => {
      heroObserver.disconnect();
      formObserver?.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl transition-all duration-300 [transition-timing-function:var(--ease-continuity)] sm:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
      aria-hidden={!visible}
    >
      <UButton
        variant="thread"
        className="w-full"
        asChild
        tabIndex={visible ? undefined : -1}
        onClick={() =>
          track("ulomis_cta_clicked", { cta: "meet_ulomis_early", placement: "mobile" })
        }
      >
        <a href="#early-access">Meet Ulomis early</a>
      </UButton>
    </div>
  );
}
