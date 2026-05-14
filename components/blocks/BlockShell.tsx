/**
 * BlockShell — the universal wrapper every block lives inside.
 *
 * Handles:
 *   • background image (Cloudinary-resolved, with crop + retina)
 *   • background YouTube video (autoplaying, muted loop) — overrides image
 *   • overlay tint (light / dark / heavy) — readability boost
 *   • spacing preset (compact / normal / large)
 *   • theme (cream / white / navy / transparent) — base section color
 *
 * The block's own content sits inside `children`. Block components don't
 * need to repeat this scaffolding — they just render their content.
 */
import { resolveImageUrl } from "@/lib/contentLoader";
import {
  parseYouTubeId,
  youTubeBackgroundEmbed,
} from "@/lib/cloudinary";
import type { BlockWrapper } from "@/lib/blockRegistry";

type Props = {
  wrapper?: BlockWrapper;
  /** Used by the renderer to bound full-bleed photos when no aspect crop applies. */
  className?: string;
  /** Aria role / id helpers for accessibility. */
  id?: string;
  /** When true, this block uses the "tight" inner container (e.g. forms). */
  narrow?: boolean;
  children: React.ReactNode;
};

const THEME_BG: Record<NonNullable<BlockWrapper["theme"]>, string> = {
  cream: "bg-cream-soft text-ink",
  white: "bg-white text-ink",
  navy: "bg-navy text-white",
  transparent: "bg-transparent",
};

const SPACING_PADDING: Record<NonNullable<BlockWrapper["spacing"]>, string> = {
  compact: "py-12 md:py-16",
  normal: "py-20 md:py-28",
  large: "py-32 md:py-40",
};

const OVERLAY_CLASS: Record<NonNullable<BlockWrapper["overlay"]>, string> = {
  none: "",
  light: "bg-white/30",
  dark: "bg-black/35",
  heavy: "bg-black/55",
};

export default async function BlockShell({
  wrapper,
  className,
  id,
  narrow,
  children,
}: Props) {
  const w: BlockWrapper = wrapper ?? {};
  const theme = w.theme ?? "transparent";
  const spacing = w.spacing ?? "normal";
  const overlay = w.overlay ?? "none";

  // Resolve background sources. YouTube wins over image if both are set.
  const ytId = w.backgroundYouTubeUrl
    ? parseYouTubeId(w.backgroundYouTubeUrl)
    : null;
  // Only treat as a real background when an image_id is actually set —
  // an empty `{ image_id: null }` shell (left over from earlier block
  // conversions) shouldn't count as "has background".
  const hasImageId = Boolean(
    w.backgroundImage &&
      typeof w.backgroundImage === "object" &&
      typeof (w.backgroundImage as { image_id?: unknown }).image_id === "string" &&
      (w.backgroundImage as { image_id: string }).image_id.length > 0,
  );
  const bgImageUrl = hasImageId
    ? await resolveImageUrl(w.backgroundImage, {
        fallback: "",
        crop: "wide",
        width: 2560,
      })
    : "";

  const hasBackground = Boolean(ytId || bgImageUrl);

  // Resolve text color. The override classes are ONLY applied when the
  // admin explicitly sets `textColor: "light"` or `"dark"`. In `auto`
  // mode we attach no class, so each block's own hardcoded Tailwind
  // colors win (the natural design — `text-ink` on cream sections,
  // `text-white` inside `.glass-dark` cards, etc.).
  //
  // This is what stops a single section toggle from accidentally
  // flipping text on inner frosted-glass cards: if admin doesn't ask
  // for an override, nothing inside is touched.
  const textClass =
    w.textColor === "light"
      ? "section-text-light"
      : w.textColor === "dark"
        ? "section-text-dark"
        : "";

  return (
    <section
      id={id}
      className={[
        "relative w-full overflow-hidden",
        hasBackground ? "" : THEME_BG[theme],
        textClass,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Background layer */}
      {ytId ? (
        <div className="absolute inset-0 pointer-events-none">
          {/* 16:9 video stretched to cover the section. The inner iframe
              is scaled up so YouTube's letterboxing doesn't show. */}
          <div className="absolute inset-0 [transform:scale(1.3)]">
            <iframe
              src={youTubeBackgroundEmbed(ytId)}
              title=""
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allow="autoplay; encrypted-media; picture-in-picture"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        </div>
      ) : bgImageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${bgImageUrl}')` }}
          aria-hidden="true"
        />
      ) : null}

      {/* Overlay layer for readability */}
      {hasBackground && overlay !== "none" && (
        <div
          className={`absolute inset-0 ${OVERLAY_CLASS[overlay]} pointer-events-none`}
          aria-hidden="true"
        />
      )}

      {/* Content layer */}
      <div
        className={[
          "relative z-10",
          SPACING_PADDING[spacing],
          "gutter-x",
          hasBackground && theme === "navy" ? "text-white" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className={narrow ? "max-w-3xl mx-auto" : "max-w-[1500px] mx-auto"}>
          {children}
        </div>
      </div>
    </section>
  );
}
