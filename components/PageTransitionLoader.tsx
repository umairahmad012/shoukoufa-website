"use client";

/**
 * Smooth page-transition loader.
 *
 * Intercepts clicks on internal links BEFORE the browser navigates,
 * shows the gold fullscreen loader, prefetches & renders the new
 * page underneath in parallel, then fades the loader out — revealing
 * the new page already in place. No "flash of new page → loader →
 * new page again" jank.
 *
 * Timeline of a click:
 *   t = 0      user clicks an internal link
 *   t = 0      preventDefault + show loader (overlay fades in)
 *   t = 0      router.push() starts navigation in parallel
 *   t = 1000ms hide loader (overlay fades out; new page is already
 *              rendered beneath it)
 *
 * Skipped automatically:
 *   • external URLs, mailto:, tel:, #anchors
 *   • target="_blank" (new-tab)
 *   • cmd/ctrl/shift/alt-click (open in new tab)
 *   • clicks on /admin links (admin has its own contextual save loaders)
 *   • same-pathname clicks (no transition needed)
 */
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiLoader } from "@/components/ui/ai-loader";

const TRANSITION_MS = 1000;

export default function PageTransitionLoader() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function shouldSkipLink(link: HTMLAnchorElement, e: MouseEvent): boolean {
      // Modifier-clicks open in a new tab — let the browser handle it.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return true;
      // Not a primary-button click — context menu, middle click, etc.
      if (e.button !== undefined && e.button !== 0) return true;
      // target="_blank" or rel="external" — leave native behavior.
      if (link.target && link.target !== "_self") return true;
      const href = link.getAttribute("href");
      if (!href) return true;
      // Pure hash links — same-page anchor jump.
      if (href.startsWith("#")) return true;
      // mailto: / tel: / other protocols.
      if (/^(mailto|tel|sms):/i.test(href)) return true;
      // External absolute URLs that aren't on this origin.
      if (/^https?:/i.test(href)) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return true;
        } catch {
          return true;
        }
      }
      // Skip admin navigations — admin has its own pending UI inline.
      if (href.startsWith("/admin") || pathname?.startsWith("/admin")) {
        return true;
      }
      return false;
    }

    function onClick(e: MouseEvent) {
      // Capture phase: find the nearest anchor in the event path.
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
        /* keep href as-is for relative routes */
      }
      if (nextPath === window.location.pathname) return;

      // Intercept. Block default + Next.js Link's own onClick.
      e.preventDefault();
      e.stopPropagation();

      // Show the loader immediately.
      setVisible(true);
      // Kick off navigation in parallel — the new page renders under
      // the overlay while it's visible.
      router.push(href);

      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
      }, TRANSITION_MS);
    }

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, router]);

  if (!visible) return null;
  return <AiLoader fullscreen />;
}
