"use client";

/**
 * Page-transition loader.
 *
 * Mounted once in app/layout.tsx. Listens to `usePathname()` and, every
 * time the path changes after the first paint, shows a fullscreen gold
 * loader overlay for ~1 second. Skipped on the very first mount so the
 * landing page doesn't open with a loader.
 *
 * Why 1 second minimum (and not "until the page is ready"):
 *   Most navigations on this site are prefetched and complete in
 *   50-300ms. A "loader while fetching" approach would flash on/off
 *   so fast it'd feel broken. A consistent 1s pause makes every
 *   transition feel intentional — a beat where the visitor knows
 *   they've moved between pages.
 *
 * Hides admin routes — the admin panel handles its own pending UI
 * inline (Save buttons swap to the AiLoader), so a fullscreen overlay
 * there would interrupt editing.
 */
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiLoader } from "@/components/ui/ai-loader";

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Don't show fullscreen loader inside /admin — admin has its own
    // contextual save loaders and the overlay would block editing.
    if (pathname?.startsWith("/admin")) return;

    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 1000);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]);

  if (!visible) return null;
  return <AiLoader fullscreen />;
}
