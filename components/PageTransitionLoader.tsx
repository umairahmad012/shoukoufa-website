"use client";

/**
 * Smooth page-transition loader.
 *
 *   • First page load (refresh / direct URL): 2 seconds.
 *   • Click-to-navigate between pages:        1 second.
 *
 * On click, captures the event BEFORE Next.js's Link handler fires,
 * preventDefault()s, shows the overlay, calls router.push() in
 * parallel so the new page renders underneath, then hides the
 * overlay after 1s — revealing the destination already in place.
 *
 * Two separate useEffects on purpose: the click listener must NOT
 * depend on pathname or `router`'s effect cleanup will clearTimeout
 * the hide-timer the moment navigation finishes, leaving the loader
 * stuck on screen.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AiLoader } from "@/components/ui/ai-loader";

const CLICK_TRANSITION_MS = 1000;
const FIRST_LOAD_MS = 2000;

export default function PageTransitionLoader() {
  const router = useRouter();
  // Start visible so the first-paint already shows the loader (no
  // flash of plain page before the timer kicks in).
  const [visible, setVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Show the loader + schedule a hide after `durationMs`. The hide
   *  uses `flushSync` so React applies the state change immediately
   *  instead of letting Next.js's router transition defer it. Without
   *  flushSync the loader stuck around for ~2s on click navigations
   *  (the setVisible(false) got batched into the transition that
   *  router.push() opened). */
  function show(durationMs: number) {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      flushSync(() => {
        setVisible(false);
      });
      hideTimer.current = null;
    }, durationMs);
  }

  // First-load: hide after 2s. Self-suppressed inside /admin.
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) {
      setVisible(false);
      return;
    }
    show(FIRST_LOAD_MS);
    // No cleanup that clearTimeouts — we WANT the hide timer to
    // outlive this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click interceptor. Stable across the component's lifetime —
  // depends only on `router`, which is stable.
  useEffect(() => {
    function shouldSkipLink(link: HTMLAnchorElement, e: MouseEvent): boolean {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true;
      if (e.button !== undefined && e.button !== 0) return true;
      if (link.target && link.target !== "_self") return true;
      const href = link.getAttribute("href");
      if (!href) return true;
      if (href.startsWith("#")) return true;
      if (/^(mailto|tel|sms):/i.test(href)) return true;
      if (/^https?:/i.test(href)) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return true;
        } catch {
          return true;
        }
      }
      // No fullscreen loader inside admin — admin has its own
      // contextual save loaders and the overlay would block editing.
      if (
        href.startsWith("/admin") ||
        window.location.pathname.startsWith("/admin")
      ) {
        return true;
      }
      return false;
    }

    function onClick(e: MouseEvent) {
      // Find the nearest <a> in the composed event path. We use
      // composedPath() so SVG-icon clicks inside an <a> still
      // resolve to the anchor.
      const path = e.composedPath ? e.composedPath() : [];
      const link =
        (path.find((n) => (n as HTMLElement)?.tagName === "A") as
          | HTMLAnchorElement
          | undefined) ??
        (e.target instanceof Element
          ? (e.target.closest("a") as HTMLAnchorElement | null) ?? undefined
          : undefined);
      if (!link) return;
      if (shouldSkipLink(link, e)) return;

      const href = link.getAttribute("href")!;
      // Resolve to a pathname so we can skip same-route clicks.
      let nextPath = href;
      try {
        nextPath = new URL(href, window.location.origin).pathname;
      } catch {
        /* relative — leave as-is */
      }
      if (nextPath === window.location.pathname) return;

      // Intercept — block default + Next.js Link's own onClick.
      e.preventDefault();
      e.stopPropagation();

      // Show loader, fire navigation in parallel, hide after 1s.
      show(CLICK_TRANSITION_MS);
      router.push(href);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      // NOTE: we deliberately do NOT clearTimeout(hideTimer.current)
      // here. If this effect re-runs for any reason, an active hide
      // timer must survive so the loader actually dismisses itself.
    };
  }, [router]);

  if (!visible) return null;
  return <AiLoader fullscreen />;
}
