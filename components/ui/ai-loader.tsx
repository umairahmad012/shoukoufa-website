"use client";

/**
 * Animated "AI-style" loader with golden gradient ring.
 *
 * Two modes:
 *
 *   1) inline — sits inside a button or row slot. Letters of the
 *      supplied text shimmer in a staggered wave while the ring
 *      rotates behind them.
 *
 *      <AiLoader text="Sending" />        // form submit
 *      <AiLoader text="Saving" />         // admin save
 *      <AiLoader text="Generating" />     // default
 *
 *   2) fullscreen — fixed full-viewport overlay with a black-grey
 *      gradient backdrop and the ring centered (no text by default).
 *      Used by PageTransitionLoader between route changes.
 *
 *      <AiLoader fullscreen />            // ring only, dark overlay
 *
 * Pure CSS animations (no JS loop). Respects prefers-reduced-motion.
 */
import { cn } from "@/lib/cn";

export function AiLoader({
  text,
  className,
  fullscreen = false,
}: {
  /** Optional text whose letters shimmer next to the ring. Omit for a
   *  ring-only loader (the fullscreen variant defaults to no text). */
  text?: string;
  /** Optional outer wrapper class for positioning / spacing. */
  className?: string;
  /** Render as a centered full-viewport overlay with a dark backdrop. */
  fullscreen?: boolean;
}) {
  const showText = typeof text === "string" && text.length > 0;
  const letters = showText ? Array.from(text!) : [];
  const ariaLabel = showText ? `${text}…` : "Loading";

  const ring = (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn(!fullscreen && "inline-flex", className)}
    >
      <div className="loader-wrapper">
        {letters.map((char, i) => (
          <span
            key={i}
            className="loader-letter"
            style={{ animationDelay: `${i * 0.1}s` }}
            aria-hidden="true"
          >
            {char === " " ? " " : char}
          </span>
        ))}
        <div className="loader" aria-hidden="true" />
      </div>
    </div>
  );

  if (!fullscreen) return ring;

  return <div className="loader-overlay">{ring}</div>;
}

export default AiLoader;
