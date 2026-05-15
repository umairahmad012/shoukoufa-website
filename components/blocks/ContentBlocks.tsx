/**
 * Content-heavy block components (multi-card grids, two-column layouts,
 * process steps, agent intro).
 */
import Link from "next/link";
import BlockShell from "./BlockShell";
import { getPortrait, resolveImageUrl } from "@/lib/contentLoader";
import type { BlockWrapper } from "@/lib/blockRegistry";
import { tc, gridColsForCount } from "@/lib/textColor";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── MEET AGENT
type MeetAgentData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  body?: string[];
  bodyColor?: string;
  quote?: string;
  quoteColor?: string;
  cta?: { label?: string; href?: string };
  portraitSide?: "left" | "right";
}>;

export async function MeetAgentBlock({ data }: { data: MeetAgentData }) {
  const portrait = await getPortrait();
  const portraitOnRight = data.portraitSide === "right";

  return (
    <BlockShell wrapper={data.wrapper}>
      <div
        className={`max-w-6xl mx-auto grid md:grid-cols-5 gap-16 md:gap-24 items-center ${
          portraitOnRight ? "" : ""
        }`}
      >
        <div className={`md:col-span-2 ${portraitOnRight ? "md:order-2" : ""}`}>
          <div
            className="aspect-[3/4] bg-cover bg-center grayscale shadow-[0_30px_60px_-20px_rgba(20,40,64,0.18)]"
            style={{ backgroundImage: `url('${portrait.full}')` }}
          />
        </div>
        <div
          className={`md:col-span-3 space-y-7 text-base md:text-lg font-light leading-[1.95] text-ink/85 ${
            portraitOnRight ? "md:order-1" : ""
          }`}
        >
          {data.eyebrow ? (
            <p className={tc("eyebrow text-navy mb-2", data.eyebrowColor)}>
              {data.eyebrow}
            </p>
          ) : null}
          {data.heading ? (
            <h2
              className={tc("heading-section text-ink", data.headingColor)}
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
            >
              {data.heading}
            </h2>
          ) : null}
          <div className="w-12 h-px bg-navy/40" />
          {(data.body ?? []).map((p, i) => (
            <p key={i} className={tc("", data.bodyColor)}>
              {p}
            </p>
          ))}
          {data.quote ? (
            <blockquote
              className={tc(
                "border-l-2 border-navy/40 pl-6 text-lg italic text-ink/75 mt-8",
                data.quoteColor,
              )}
            >
              “{data.quote}”
            </blockquote>
          ) : null}
          {data.cta?.label && data.cta?.href ? (
            <Link
              href={data.cta.href}
              className="inline-block mt-6 px-9 py-3 border border-navy/40 text-navy text-[0.7rem] tracking-[0.32em] uppercase font-light hover:bg-navy hover:text-white transition-all duration-500"
            >
              {data.cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── THREE CARDS
type ThreeCardsData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  cards?: Array<{
    title?: string;
    titleColor?: string;
    body?: string;
    bodyColor?: string;
    cta?: string;
    href?: string;
    image?: { image_id?: string };
  }>;
}>;

export async function ThreeCardsBlock({ data }: { data: ThreeCardsData }) {
  const cards = await Promise.all(
    (data.cards ?? []).map(async (c) => {
      const img = await resolveImageUrl(c.image, {
        fallback:
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&auto=format&fit=crop&q=85",
        crop: "portrait",
        width: 1200,
      });
      return { ...c, _img: img };
    }),
  );

  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-8", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      {/* Adaptive grid — if admin adds a 4th card, render 2×2 instead
          of 3+1 orphan. 5+ cards lay out as 3 across. */}
      <div
        className={`max-w-6xl mx-auto grid ${gridColsForCount(cards.length)} gap-6 md:gap-10 items-stretch`}
      >
        {cards.map((c, i) => {
          const CardWrap = c.href ? Link : ("div" as React.ElementType);
          return (
            <CardWrap
              key={i}
              {...(c.href ? { href: c.href } : {})}
              className="group relative block aspect-[3/4.2] overflow-hidden bg-navy-dark"
            >
              {/* Photo background. Position shifted up so the subject
                  stays visible above the glass panel anchored at the
                  bottom. */}
              <div
                className="absolute inset-0 bg-cover transition-transform duration-[1.4s] ease-editorial group-hover:scale-[1.05]"
                style={{
                  backgroundImage: `url('${c._img}')`,
                  backgroundPosition: "center 30%",
                }}
              />
              {/* Subtle dim so text on glass stays legible against any photo */}
              <div className="absolute inset-0 overlay-card" />

              {/* Frosted glass content panel anchored at the bottom.
                  Padding + insets match the original PillarCards layout
                  exactly so content always fits inside the card and the
                  three panels are the same height regardless of how
                  long any individual body string is. The body is
                  line-clamped to keep cards symmetric. */}
              <div className="absolute left-5 right-5 bottom-5 md:left-8 md:right-8 md:bottom-8 glass-dark p-6 md:p-9 text-white flex flex-col">
                {c.title ? (
                  <h3
                    className={tc("text-lg md:text-2xl uppercase mb-4 md:mb-5", c.titleColor)}
                    style={{ fontWeight: 400, letterSpacing: "0.08em" }}
                  >
                    {c.title}
                  </h3>
                ) : null}
                {c.body ? (
                  <p
                    className={tc(
                      "text-sm md:text-[0.95rem] font-light leading-[1.8] md:leading-[1.85] text-white/85 mb-5 md:mb-7",
                      c.bodyColor,
                    )}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.body}
                  </p>
                ) : null}
                {c.cta && c.href ? (
                  // Letter-spacing dialed back so long uppercase CTAs
                  // like "BUYING WITH SHOUKOUFA" fit inside the 219px
                  // glass panel at every viewport. `truncate` guards
                  // against runaway labels too long for the container.
                  <span className="inline-flex items-center gap-2 md:gap-3 text-[0.58rem] md:text-[0.65rem] tracking-[0.2em] md:tracking-[0.24em] uppercase font-light text-white border-t border-white/25 pt-4 md:pt-5 mt-auto min-w-0 max-w-full">
                    <span className="truncate">{c.cta}</span>
                    <span className="transition-transform duration-500 ease-editorial group-hover:translate-x-1.5 group-hover:-translate-y-1.5 flex-shrink-0">
                      ↗
                    </span>
                  </span>
                ) : null}
              </div>
            </CardWrap>
          );
        })}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── PRACTICE AREAS
type PracticeAreasData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  cards?: Array<{ h?: string; hColor?: string; p?: string; pColor?: string }>;
}>;

export async function PracticeAreasBlock({ data }: { data: PracticeAreasData }) {
  const cards = data.cards ?? [];
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-8", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      {/* Adaptive grid: 4 cards → 2×2, 6 → 3×2, 5/7+ → 3 cols. Never
          leaves a single orphan card on its own row at the lg+ breakpoint. */}
      <div
        className={`max-w-5xl mx-auto grid ${gridColsForCount(cards.length)} gap-8 md:gap-10`}
      >
        {cards.map((b, i) => (
          <div
            key={i}
            className="glass-light glow-on-hover p-7 md:p-12 flex flex-col"
          >
            <p
              className="text-3xl text-navy mb-2 tracking-wide"
              style={{ fontWeight: 200 }}
            >
              {String(i + 1).padStart(2, "0")}
            </p>
            <div className="my-6 w-10 h-px bg-navy/40" />
            {b.h ? (
              <h3
                className={tc("text-lg uppercase mb-5 text-ink", b.hColor)}
                style={{ fontWeight: 400, letterSpacing: "0.08em" }}
              >
                {b.h}
              </h3>
            ) : null}
            {b.p ? (
              <p
                className={tc(
                  "text-sm md:text-base font-light leading-[1.85] text-ink/75",
                  b.pColor,
                )}
              >
                {b.p}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── PROCESS STEPS
type ProcessStepsData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  steps?: Array<{ n?: string; h?: string; hColor?: string; p?: string; pColor?: string }>;
}>;

export async function ProcessStepsBlock({ data }: { data: ProcessStepsData }) {
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-8", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
        {(data.steps ?? []).map((s, i) => (
          <div key={i} className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-2">
              <p
                className="text-5xl md:text-6xl text-navy/30"
                style={{ fontWeight: 200 }}
              >
                {s.n}
              </p>
            </div>
            <div className="md:col-span-10">
              {s.h ? (
                <h3
                  className={tc("text-lg md:text-xl uppercase mb-4 text-ink", s.hColor)}
                  style={{ fontWeight: 400, letterSpacing: "0.08em" }}
                >
                  {s.h}
                </h3>
              ) : null}
              {s.p ? (
                <p
                  className={tc(
                    "text-base md:text-lg font-light leading-[1.9] text-ink/80",
                    s.pColor,
                  )}
                >
                  {s.p}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── TWO COLUMN
type TwoColumnData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  paragraphs?: string[];
  paragraphsColor?: string;
  image?: { image_id?: string };
  imageSide?: "left" | "right";
  cta?: { label?: string; href?: string };
}>;

export async function TwoColumnBlock({ data }: { data: TwoColumnData }) {
  const img = await resolveImageUrl(data.image, {
    fallback:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=2000&auto=format&fit=crop&q=85",
    crop: "landscape",
    width: 1600,
  });
  const imgRight = data.imageSide !== "left";

  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className={imgRight ? "" : "md:order-2"}>
          {data.eyebrow ? (
            <p className={tc("eyebrow mb-6", data.eyebrowColor)}>{data.eyebrow}</p>
          ) : null}
          {data.heading ? (
            <h2
              className={tc("heading-section text-ink mb-8", data.headingColor)}
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
            >
              {data.heading}
            </h2>
          ) : null}
          <div className="mb-8 w-12 h-px bg-navy/40" />
          <div className="space-y-5 text-base md:text-lg font-light leading-[1.9] text-ink/85">
            {(data.paragraphs ?? []).map((p, i) => (
              <p key={i} className={tc("", data.paragraphsColor)}>
                {p}
              </p>
            ))}
          </div>
          {data.cta?.label && data.cta?.href ? (
            <Link
              href={data.cta.href}
              className="inline-block mt-8 px-9 py-3 border border-navy/40 text-navy text-[0.7rem] tracking-[0.32em] uppercase font-light hover:bg-navy hover:text-white transition-all duration-500"
            >
              {data.cta.label}
            </Link>
          ) : null}
        </div>
        <div
          className={`aspect-[4/3] bg-cover bg-center shadow-[0_30px_60px_-20px_rgba(20,40,64,0.18)] ${
            imgRight ? "" : "md:order-1"
          }`}
          style={{ backgroundImage: `url('${img}')` }}
        />
      </div>
    </BlockShell>
  );
}
