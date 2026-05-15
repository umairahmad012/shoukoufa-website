"use client";

/**
 * Smooth page-transition loader.
 *
 *   • First page load (refresh / direct URL): 2 seconds.
 *   • Click-to-navigate between pages:        1 second.
 *
 * IMPORTANT — module-level state is intentional. Next.js can remount
 * this client component on route change (the App Router does treat
 * layout client components as stable, but in practice Reaches mount
 * lifecycles run on each navigation). If the loader's visibility
 * lived in `useState`, the new instance's first-load useEffect would
 * fire and start a fresh 2-second timer — overriding the 1-second
 * timer the click handler set on the old instance. That's exactly
 * the bug we saw: clicks dismissed at ~2s instead of 1s.
 *
 * The fix: store the "hide-at" deadline in a module-level variable,
 * and subscribe to it via useSyncExternalStore. Module state
 * survives the component remount, so the click's 1-second deadline
 * sticks. flushSync forces the final dismissal to apply
 * synchronously even if Next.js's router transition is in flight.
 */
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { AiLoader } from "@/components/ui/ai-loader";

const CLICK_TRANSITION_MS = 1000;

// ─── Module-level store (survives component remount) ─────────────
let activeHideAt: number | null = null;
const subscribers = new Set<() => void>();

function setActiveHideAt(value: number | null) {
  activeHideAt = value;
  for (const s of subscribers) s();
}
function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
function getSnapshot() {
  return activeHideAt;
}
function getServerSnapshot(): number | null {
  // Server render: no loader. The 2-second first-load timer kicks
  // in client-side. Trade-off: a few ms of plain page before the
  // loader appears, in exchange for zero hydration mismatch.
  return null;
}

export default function PageTransitionLoader() {
  const router = useRouter();
  const hideAt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // First-load loader intentionally disabled — it was adding ~2s
  // of perceived wait on the very first visit, hurting perceived
  // performance and the "real" pageload speed metrics. The
  // page-transition loader (on inter-page clicks) still runs.

  // Whenever the deadline changes, schedule a single timer for the
  // remaining time. Cleanup clears the timer so we never double-fire.
  useEffect(() => {
    if (hideAt === null) return;
    const remaining = hideAt - Date.now();
    if (remaining <= 0) {
      setActiveHideAt(null);
      return;
    }
    const t = setTimeout(() => {
      // flushSync so React applies the hide synchronously, even if
      // Next.js's router transition is currently batching state
      // updates from router.push().
      flushSync(() => setActiveHideAt(null));
    }, remaining);
    return () => clearTimeout(t);
  }, [hideAt]);

  // Click interceptor — sets a 1-second deadline before kicking off
  // the navigation. router.push() runs in parallel; the new page
  // renders under the overlay during the 1-second window.
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
      if (
        href.startsWith("/admin") ||
        window.location.pathname.startsWith("/admin")
      ) {
        return true;
      }
      return false;
    }

    function onClick(e: MouseEvent) {
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
      let nextPath = href;
      try {
        nextPath = new URL(href, window.location.origin).pathname;
      } catch {
        /* relative — leave as-is */
      }
      if (nextPath === window.location.pathname) return;

      e.preventDefault();
      e.stopPropagation();
      setActiveHideAt(Date.now() + CLICK_TRANSITION_MS);
      router.push(href);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [router]);

  if (hideAt === null) return null;
  return <AiLoader fullscreen />;
}
