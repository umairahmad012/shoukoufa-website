/**
 * Content-heavy block components (multi-card grids, two-column layouts,
 * process steps, agent intro).
 */
import Link from "next/link";
import BlockShell from "./BlockShell";
import { getPortrait, resolveImageUrl } from "@/lib/contentLoader";
import type { BlockWrapper } from "@/lib/blockRegistry";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── MEET AGENT
type MeetAgentData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  body?: string[];
  quote?: string;
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
            <p className="eyebrow text-navy mb-2">{data.eyebrow}</p>
          ) : null}
          {data.heading ? (
            <h2
              className="heading-section text-ink"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
            >
              {data.heading}
            </h2>
          ) : null}
          <div className="w-12 h-px bg-navy/40" />
          {(data.body ?? []).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {data.quote ? (
            <blockquote className="border-l-2 border-navy/40 pl-6 text-lg italic text-ink/75 mt-8">
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
  heading?: string;
  cards?: Array<{
    title?: string;
    body?: string;
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
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-7 md:gap-9">
        {cards.map((c, i) => (
          <div
            key={i}
            className="relative aspect-[3/4] overflow-hidden glow-on-hover"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${c._img}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
            <div className="relative z-10 h-full flex flex-col justify-end p-8 text-white">
              {c.title ? (
                <h3
                  className="text-2xl md:text-3xl uppercase mb-4"
                  style={{ fontWeight: 200, letterSpacing: "0.08em" }}
                >
                  {c.title}
                </h3>
              ) : null}
              {c.body ? (
                <p className="text-sm md:text-base font-light leading-[1.8] text-white/90 mb-6">
                  {c.body}
                </p>
              ) : null}
              {c.cta && c.href ? (
                <Link
                  href={c.href}
                  className="inline-block self-start text-[0.7rem] tracking-[0.32em] uppercase border-b border-white/60 pb-1 hover:border-white transition-colors"
                >
                  {c.cta}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── PRACTICE AREAS
type PracticeAreasData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  cards?: Array<{ h?: string; p?: string }>;
}>;

export async function PracticeAreasBlock({ data }: { data: PracticeAreasData }) {
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
      </div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 md:gap-10">
        {(data.cards ?? []).map((b, i) => (
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
                className="text-lg uppercase mb-5 text-ink"
                style={{ fontWeight: 400, letterSpacing: "0.08em" }}
              >
                {b.h}
              </h3>
            ) : null}
            {b.p ? (
              <p className="text-sm md:text-base font-light leading-[1.85] text-ink/75">
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
  heading?: string;
  steps?: Array<{ n?: string; h?: string; p?: string }>;
}>;

export async function ProcessStepsBlock({ data }: { data: ProcessStepsData }) {
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
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
                  className="text-lg md:text-xl uppercase mb-4 text-ink"
                  style={{ fontWeight: 400, letterSpacing: "0.08em" }}
                >
                  {s.h}
                </h3>
              ) : null}
              {s.p ? (
                <p className="text-base md:text-lg font-light leading-[1.9] text-ink/80">
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
  heading?: string;
  paragraphs?: string[];
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
          {data.eyebrow ? <p className="eyebrow mb-6">{data.eyebrow}</p> : null}
          {data.heading ? (
            <h2
              className="heading-section text-ink mb-8"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
            >
              {data.heading}
            </h2>
          ) : null}
          <div className="mb-8 w-12 h-px bg-navy/40" />
          <div className="space-y-5 text-base md:text-lg font-light leading-[1.9] text-ink/85">
            {(data.paragraphs ?? []).map((p, i) => (
              <p key={i}>{p}</p>
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
