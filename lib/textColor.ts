/**
 * Per-text-field color override.
 *
 * Every user-facing text field in a block (eyebrow, heading, subtitle,
 * card title, paragraph, etc.) is paired with a small color dropdown
 * in the admin editor. The value is stored in a sibling key on the
 * block's data, named `<fieldName>Color`, and is one of:
 *
 *   • "auto"  (or unset) — leave the block's own hardcoded color in place
 *   • "light" — force white text (via `.text-force-light`)
 *   • "dark"  — force ink text (via `.text-force-dark`)
 *
 * Block components apply `textColorClass(c)` to the className of the
 * element. The CSS utilities are defined in `app/globals.css` and use
 * `!important` so they reliably override the block's hardcoded
 * `text-ink` / `text-white/85` etc.
 *
 * This is the per-field replacement for the old section-level
 * `wrapper.textColor` toggle. The wrapper toggle still works for
 * flipping ALL ambient section text at once (used when a section's
 * background contrast needs a wholesale flip), but most fine-grained
 * needs are covered by these per-field controls.
 */
export type TextColor = "auto" | "light" | "dark";

export function textColorClass(c?: TextColor | string | null): string {
  if (c === "light") return "text-force-light";
  if (c === "dark") return "text-force-dark";
  return "";
}

/** Join class names, skipping falsy. Tiny inline cn() to avoid extra deps. */
export function joinClasses(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Shorthand: append the force-color class for a per-field color value
 * onto an existing className string. Use inside block JSX:
 *
 *   <h2 className={tc("heading-section text-ink", data.headingColor)}>
 *     {data.heading}
 *   </h2>
 */
export function tc(className: string, color?: TextColor | string | null): string {
  return joinClasses(className, textColorClass(color));
}
