"use client";

/**
 * Animated "AI-style" loader.
 *
 * Letters of the supplied text shimmer in a staggered wave while a
 * rotating gradient ring spins behind them. Built from CSS keyframes
 * defined in `app/globals.css` — no JS animation loop, no extra deps.
 *
 * Usage:
 *   <AiLoader />                       // default "Generating"
 *   <AiLoader text="Sending" />        // form submit
 *   <AiLoader text="Saving" />         // admin save
 *   <AiLoader text="Loading" />        // page transition
 *
 *   <AiLoader text="Sending" className="my-4" />   // outer wrapper class
 */
import { cn } from "@/lib/cn";

export function AiLoader({
  text = "Generating",
  className,
}: {
  /** The word whose letters shimmer. Letters animate with a stagger.
   *  Spaces are preserved. Keep it short — long strings break the layout. */
  text?: string;
  /** Optional outer wrapper class for positioning / spacing. */
  className?: string;
}) {
  // Split into letters so each gets its own animated span.
  // Non-breaking space keeps spacing inside words like "Sending data".
  const letters = Array.from(text);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${text}…`}
      className={cn("inline-flex", className)}
    >
      <div className="loader-wrapper">
        {letters.map((char, i) => (
          <span
            key={i}
            className="loader-letter"
            style={{ animationDelay: `${i * 0.1}s` }}
            aria-hidden="true"
          >
            {char === " " ? " " : char}
          </span>
        ))}
        <div className="loader" aria-hidden="true" />
      </div>
    </div>
  );
}

export default AiLoader;
