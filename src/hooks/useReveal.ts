import { useEffect, useRef, useState } from "react";

interface UseRevealOptions {
  /** Fraction of the element that must be visible before revealing. */
  threshold?: number;
  /** Keeps the reveal from firing until the element is comfortably in view. */
  rootMargin?: string;
}

/**
 * Fire-once scroll reveal. Returns a ref to attach and whether the element has
 * entered the viewport yet.
 *
 * Falls back to "revealed" when IntersectionObserver is unavailable so content
 * can never get stranded at opacity 0.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.1,
  rootMargin = "0px 0px -12% 0px",
}: UseRevealOptions = {}) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown, threshold, rootMargin]);

  return { ref, shown };
}
