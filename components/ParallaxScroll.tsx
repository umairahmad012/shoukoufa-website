"use client";

/**
 * Cross-device parallax for `.bg-parallax` background-image layers.
 *
 * Why JS instead of `background-attachment: fixed`:
 *   iOS Safari (and several Android browsers) either skip `fixed`
 *   attachment entirely or render it through a low-resolution
 *   off-screen buffer, producing the empty / blurred backgrounds the
 *   user reported. Pinning the visible portion of the image with a
 *   scroll-driven `transform` works the same on every browser and
 *   benefits from GPU compositing (no main-thread layout cost).
 *
 * Effect:
 *   The bg image moves at a reduced speed relative to its parent
 *   section, giving a "the image is anchored, content scrolls over
 *   it" feel without the iOS quirks.
 *
 * Accessibility:
 *   Honors `prefers-reduced-motion` by clearing transforms so the
 *   bg stays put in its container (no parallax for users who opted
 *   out of motion).
 *
 * Re-binds on every route change so newly mounted hero sections get
 * picked up.
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Headroom for the bg image. Scale 1.15 keeps the image close to
// its native resolution (only 15% upscale) while still giving room
// to translate ~7.5% of section height in either direction. Larger
// scale values blurred the image noticeably on Retina screens.
const SCALE = 1.15;

export default function ParallaxScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const els = Array.from(
      document.querySelectorAll<HTMLElement>(".bg-parallax"),
    );
    if (els.length === 0) return;

    type Item = { el: HTMLElement; parent: HTMLElement };
    const items: Item[] = els.map((el) => {
      const parent = el.parentElement ?? el;
      el.style.willChange = "transform";
      // Lock the scale baseline so the image always overflows its
      // box by (SCALE - 1) / 2 on each side, giving translation room.
      el.style.transformOrigin = "center center";
      return { el, parent };
    });

    let raf = 0;
    function update() {
      raf = 0;
      const vh = window.innerHeight;
      for (const { el, parent } of items) {
        const rect = parent.getBoundingClientRect();
        // Skip elements far outside the viewport so we don't burn
        // cycles on every scroll tick.
        if (rect.bottom < -vh || rect.top > vh * 2) continue;
        // Center-of-section distance from center-of-viewport. As the
        // user scrolls down this goes from large-positive (section
        // entering from below) through 0 (centered) to large-negative
        // (section has scrolled past).
        const centerDelta = rect.top + rect.height / 2 - vh / 2;
        // Confine the parallax travel to (SCALE - 1) / 2 of section
        // height so the bg image never exposes its edges. Travel is
        // proportional to how far the section's center is from the
        // viewport center.
        const maxTravel = (rect.height * (SCALE - 1)) / 2;
        const range = vh / 2 + rect.height / 2;
        const normalized = Math.max(-1, Math.min(1, centerDelta / range));
        const translateY = normalized * maxTravel;
        el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${SCALE})`;
      }
    }

    function onScroll() {
      if (raf !== 0) return;
      raf = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== 0) cancelAnimationFrame(raf);
      for (const { el } of items) {
        el.style.willChange = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
    };
  }, [pathname]);

  return null;
}
