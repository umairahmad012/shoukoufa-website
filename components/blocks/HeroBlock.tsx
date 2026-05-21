import Link from "next/link";
import ShimmerText from "@/components/ShimmerText";
import Counter from "@/components/Counter";
import { resolveImageUrl } from "@/lib/contentLoader";
import {
  parseYouTubeId,
  youTubeBackgroundEmbed,
} from "@/lib/cloudinary";
import type { BlockWrapper } from "@/lib/blockRegistry";
import { tc } from "@/lib/textColor";

type HeroData = {
  eyebrow?: string;
  eyebrowColor?: string;
  titleLines?: string[];
  titleLinesColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  ctas?: Array<{ label?: string; href?: string; style?: string }>;
  stats?: Array<{
    value?: string | number;
    valueColor?: string;
    decimals?: string | number;
    prefix?: string;
    suffix?: string;
    label?: string;
    labelColor?: string;
  }>;
  wrapper?: BlockWrapper;
};

/**
 * Hero — full-bleed dramatic opener used at the top of most pages.
 *
 * Unlike most blocks, the hero owns its OWN full-height layout (not
 * inside BlockShell) because it needs min-h-screen sizing and direct
 * control over the background layer. The wrapper's background image /
 * YouTube video / overlay still apply.
 */
export default async function HeroBlock({ data }: { data: HeroData }) {
  const w = data.wrapper ?? {};
  // Hero is photo-dominant by design — its own markup hardcodes white
  // text. Only attach an override class when admin explicitly asks for
  // it (e.g. a rare cream-photo hero where ink reads better).
  const textClass =
    w.textColor === "light"
      ? "section-text-light"
      : w.textColor === "dark"
        ? "section-text-dark"
        : "";
  const ytId = w.backgroundYouTubeUrl
    ? parseYouTubeId(w.backgroundYouTubeUrl)
    : null;

  const bgImage = w.backgroundImage
    ? await resolveImageUrl(w.backgroundImage, {
        fallback:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85",
        crop: "wide",
        width: 3840,
      })
    : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85";

  const titleLines = data.titleLines ?? [];
  const ctas = data.ctas ?? [];
  const stats = data.stats ?? [];

  return (
    <section className={`relative w-full min-h-[80vh] md:min-h-screen overflow-hidden bg-navy-dark ${textClass}`}>
      {/* Background */}
      <div className="absolute inset-0">
        {ytId ? (
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
        ) : (
          <>
            {/* Desktop: full-bleed bg with cover + parallax */}
            <div
              className="hidden md:block absolute inset-0 bg-cover bg-center bg-parallax"
              style={{ backgroundImage: `url('${bgImage}')` }}
            />
            {/* Mobile: real <img> anchored to top, scaled UP via object-cover
                so the architecture stays in frame (landscape at the bottom
                of the source crops off). Image occupies the top 58vh, then
                a mask-image fade dissolves the bottom ~32% of the image
                into the navy section just below the headline. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bgImage}
              alt=""
              aria-hidden="true"
              className="md:hidden absolute inset-x-0 top-0 w-full h-[58vh] object-cover object-top select-none"
              style={{
                maskImage:
                  "linear-gradient(to bottom, black 0%, black 68%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, black 68%, transparent 100%)",
              }}
            />
          </>
        )}
        <div className="absolute inset-0 overlay-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[80vh] md:min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-8 pt-28 md:pt-32 pb-10 md:pb-12">
          {data.eyebrow ? (
            <p
              className={tc(
                "eyebrow-light mb-7 md:mb-10 animate-fade-in",
                data.eyebrowColor,
              )}
            >
              {data.eyebrow}
            </p>
          ) : null}

          {titleLines.length > 0 && (
            <h1
              className={tc(
                "heading-display text-white animate-fade-in-up max-w-full",
                data.titleLinesColor,
              )}
              style={{
                fontSize: "clamp(1.5rem, 6.5vw, 6rem)",
                lineHeight: 1.06,
              }}
            >
              <ShimmerText delay={1.2}>
                {titleLines.map((line, i) => (
                  <span
                    key={i}
                    className="block whitespace-normal sm:whitespace-nowrap break-words"
                  >
                    {line}
                  </span>
                ))}
              </ShimmerText>
            </h1>
          )}

          <div className="mt-9 md:mt-12 w-14 md:w-16 h-px bg-white/40" />

          {data.subtitle ? (
            <p
              className={tc(
                "mt-9 md:mt-12 max-w-xl text-sm sm:text-base md:text-lg font-light text-white/90 leading-[1.85] md:leading-[1.9] px-2",
                data.subtitleColor,
              )}
            >
              {data.subtitle}
            </p>
          ) : null}

          {ctas.length > 0 && (
            <div className="mt-12 md:mt-14 flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto px-2">
              {ctas.map((cta, i) =>
                cta.label && cta.href ? (
                  <Link
                    key={i}
                    href={cta.href}
                    className={
                      cta.style === "outline" ? "btn-glass-outline" : "btn-glass"
                    }
                  >
                    {cta.label}
                  </Link>
                ) : null,
              )}
            </div>
          )}
        </div>

        {stats.length > 0 && (
          // Frosted glass stat strip — ONE container with internal dividers.
          // Uses `glass-dark` (not glass-pill) so the animated golden border
          // shine runs around the whole strip. The thin white line under each
          // counter is the "accent line" — restored from the original Hero.
          <div className="pb-14 md:pb-20 px-4 sm:px-6">
            <div
              className="max-w-6xl mx-auto glass-dark rounded-[2px] animate-fade-in-up"
              style={{ animationDelay: "1.3s", animationFillMode: "both" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3">
                {stats.map((s, i) => {
                  const num =
                    typeof s.value === "number"
                      ? s.value
                      : parseFloat(String(s.value ?? "0")) || 0;
                  const dec =
                    typeof s.decimals === "number"
                      ? s.decimals
                      : s.decimals
                        ? parseInt(String(s.decimals), 10)
                        : undefined;
                  return (
                    <div
                      key={i}
                      className={`px-6 sm:px-8 md:px-12 py-10 sm:py-12 md:py-16 text-center ${
                        i > 0
                          ? "md:border-l border-white/15 border-t md:border-t-0"
                          : ""
                      }`}
                    >
                      <p
                        className={tc(
                          "text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-wide",
                          s.valueColor,
                        )}
                        style={{ fontWeight: 200, letterSpacing: "0.04em" }}
                      >
                        <Counter
                          to={num}
                          decimals={dec}
                          prefix={s.prefix}
                          suffix={s.suffix}
                        />
                      </p>
                      <div className="mx-auto my-4 md:my-5 w-8 md:w-9 h-px bg-white/35" />
                      <p
                        className={tc(
                          "text-[0.62rem] sm:text-[0.68rem] md:text-[0.75rem] tracking-[0.30em] md:tracking-[0.32em] uppercase text-white/80 px-2",
                          s.labelColor,
                        )}
                        style={{ fontWeight: 400 }}
                      >
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
