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
 * Crispness:
 *   The first cut used `transform: scale(1.15)` to give translate
 *   headroom, but GPU `scale()` interpolates pixels — measurably
 *   softer on Retina. We now extend the element's box natively via
 *   negative top/bottom offsets (`top: -7.5%; bottom: -7.5%`) so
 *   `background-size: cover` renders the image at its true delivered
 *   size with the browser's native scaler. Only `translate3d(...)`
 *   moves on scroll — translation is pixel-perfect on the GPU and
 *   doesn't degrade quality.
 *
 * Accessibility:
 *   Honors `prefers-reduced-motion` by clearing transforms so the
 *   bg stays put in its container.
 *
 * Re-binds on every route change so newly mounted hero sections get
 * picked up.
 */

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Each bg layer extends HEADROOM_PCT above and below its section
// box. That extra height (a) keeps the image native-resolution and
// (b) gives `translate3d` somewhere to move without exposing edges.
const HEADROOM_PCT = 7.5;

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
      // Extend the element's box naturally — this gives translate
      // headroom WITHOUT any `transform: scale()`, so the image
      // renders at its true delivered resolution.
      el.style.top = `-${HEADROOM_PCT}%`;
      el.style.bottom = `-${HEADROOM_PCT}%`;
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
        // Cap travel to (HEADROOM_PCT/100) of section height — that's
        // exactly how much overflow we built in via top/bottom offsets.
        const maxTravel = rect.height * (HEADROOM_PCT / 100);
        const range = vh / 2 + rect.height / 2;
        const normalized = Math.max(-1, Math.min(1, centerDelta / range));
        const translateY = normalized * maxTravel;
        el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
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
        el.style.top = "";
        el.style.bottom = "";
      }
    };
  }, [pathname]);

  return null;
}
