import Link from "next/link";
import ShimmerText from "@/components/ShimmerText";
import Counter from "@/components/Counter";
import { resolveImageUrl } from "@/lib/contentLoader";
import {
  parseYouTubeId,
  youTubeBackgroundEmbed,
} from "@/lib/cloudinary";
import type { BlockWrapper } from "@/lib/blockRegistry";

type HeroData = {
  eyebrow?: string;
  titleLines?: string[];
  subtitle?: string;
  ctas?: Array<{ label?: string; href?: string; style?: string }>;
  stats?: Array<{
    value?: string | number;
    decimals?: string | number;
    prefix?: string;
    suffix?: string;
    label?: string;
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
  const ytId = w.backgroundYouTubeUrl
    ? parseYouTubeId(w.backgroundYouTubeUrl)
    : null;

  const bgImage = w.backgroundImage
    ? await resolveImageUrl(w.backgroundImage, {
        fallback:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85",
        crop: "wide",
        width: 2560,
      })
    : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85";

  const titleLines = data.titleLines ?? [];
  const ctas = data.ctas ?? [];
  const stats = data.stats ?? [];

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-navy-dark">
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
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
        )}
        <div className="absolute inset-0 overlay-hero" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-8 pt-28 md:pt-32 pb-10 md:pb-12">
          {data.eyebrow ? (
            <p className="eyebrow-light mb-7 md:mb-10 animate-fade-in">
              {data.eyebrow}
            </p>
          ) : null}

          {titleLines.length > 0 && (
            <h1
              className="heading-display text-white animate-fade-in-up"
              style={{
                fontSize: "clamp(1.25rem, 6.5vw, 6rem)",
                lineHeight: 1.06,
              }}
            >
              <ShimmerText delay={1.2}>
                {titleLines.map((line, i) => (
                  <span key={i} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </ShimmerText>
            </h1>
          )}

          <div className="mt-9 md:mt-12 w-14 md:w-16 h-px bg-white/40" />

          {data.subtitle ? (
            <p className="mt-9 md:mt-12 max-w-xl text-sm sm:text-base md:text-lg font-light text-white/90 leading-[1.85] md:leading-[1.9] px-2">
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
                      cta.style === "outline"
                        ? "px-9 py-4 border border-white/60 text-white text-[0.72rem] tracking-[0.28em] uppercase font-light hover:bg-white hover:text-navy transition-all duration-500 ease-editorial text-center"
                        : "btn-glass"
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
          <div className="pb-10 md:pb-14 px-6 sm:px-8">
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12">
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
                    className="glass-pill px-6 py-5 sm:py-6 text-center"
                  >
                    <p
                      className="text-3xl md:text-4xl text-white mb-2"
                      style={{ fontWeight: 200 }}
                    >
                      <Counter
                        to={num}
                        decimals={dec}
                        prefix={s.prefix}
                        suffix={s.suffix}
                      />
                    </p>
                    <p className="text-[0.62rem] tracking-[0.3em] uppercase text-white/80 leading-[1.7]">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
