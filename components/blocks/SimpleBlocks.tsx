/**
 * Simple block components — grouped here because each is short and
 * shares the BlockShell scaffolding. Complex blocks (Hero, MeetAgent,
 * specials) live in their own files.
 */
import Link from "next/link";
import BlockShell from "./BlockShell";
import DarkBreak from "@/components/DarkBreak";
import Counter from "@/components/Counter";
import { resolveImageUrl } from "@/lib/contentLoader";
import {
  parseYouTubeId,
  youTubeBackgroundEmbed,
} from "@/lib/cloudinary";
import type { BlockWrapper } from "@/lib/blockRegistry";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── PARAGRAPH BLOCK
type ParagraphBlockData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  paragraphs?: string[];
}>;

export async function ParagraphBlock({ data }: { data: ParagraphBlockData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-12">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        <div className="mx-auto mt-12 mb-12 w-12 h-px bg-navy/40" />
      </div>
      <div className="space-y-6 text-base md:text-lg font-light leading-[1.9] text-ink/85">
        {(data.paragraphs ?? []).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── BULLET LIST
type BulletListData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  bullets?: string[];
}>;

export async function BulletListBlock({ data }: { data: BulletListData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-12 md:mb-16">
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
      <div className="max-w-3xl mx-auto space-y-6 text-base md:text-lg font-light text-ink/85 leading-[1.9]">
        {(data.bullets ?? []).map((line, i) => (
          <div key={i} className="flex items-start gap-5">
            <span
              className="text-navy text-2xl leading-none mt-1.5"
              style={{ fontWeight: 200 }}
            >
              ·
            </span>
            <p>{line}</p>
          </div>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── FAQ
type FaqData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  items?: Array<{ q: string; a: string }>;
}>;

export async function FaqBlock({ data }: { data: FaqData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-12 md:mb-16">
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
      <div className="space-y-4 max-w-3xl mx-auto">
        {(data.items ?? []).map((f, i) => (
          <details
            key={i}
            className="group glass-light px-8 md:px-10 py-7 transition-all"
          >
            <summary className="cursor-pointer flex items-center justify-between text-base md:text-lg font-light text-ink list-none">
              <span>{f.q}</span>
              <span className="text-navy text-2xl ml-6 group-open:rotate-45 transition-transform duration-400 ease-editorial flex-shrink-0">
                +
              </span>
            </summary>
            <p className="mt-6 text-base font-light text-ink/75 leading-[1.9]">
              {f.a}
            </p>
          </details>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── STATS STRIP
type StatsStripData = WithWrapper<{
  stats?: Array<{
    value?: string | number;
    decimals?: string | number;
    prefix?: string;
    suffix?: string;
    label?: string;
  }>;
}>;

export async function StatsStripBlock({ data }: { data: StatsStripData }) {
  const stats = data.stats ?? [];
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 text-center">
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
            <div key={i}>
              <p
                className="text-5xl md:text-6xl text-navy mb-6"
                style={{ fontWeight: 200 }}
              >
                <Counter to={num} decimals={dec} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <div className="mx-auto mb-5 w-8 h-px bg-navy/40" />
              <p className="text-[0.7rem] tracking-[0.32em] uppercase text-ink-muted leading-[1.7]">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── DARK BREAK
type DarkBreakData = WithWrapper<{
  eyebrow?: string;
  quote?: string;
  attribution?: string;
}>;

export async function DarkBreakBlock({ data }: { data: DarkBreakData }) {
  // DarkBreak component takes a direct bgImage URL — resolve it here from
  // the wrapper's backgroundImage so admins can swap it via the universal
  // wrapper field.
  const w = data.wrapper ?? {};
  const bg = w.backgroundImage
    ? await resolveImageUrl(w.backgroundImage, {
        fallback:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85",
        crop: "wide",
        width: 2560,
      })
    : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2560&auto=format&fit=crop&q=85";

  // YouTube background variant — fall through to DarkBreak for image; for
  // video we render an inline iframe with the same quote overlay.
  const ytId = w.backgroundYouTubeUrl
    ? parseYouTubeId(w.backgroundYouTubeUrl)
    : null;
  if (ytId) {
    return (
      <section className="relative w-full min-h-[50vh] overflow-hidden bg-navy-dark">
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
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 min-h-[50vh] flex items-center justify-center px-6 py-20">
          <div className="glass-dark max-w-2xl mx-auto p-10 md:p-14 text-center text-white">
            {data.eyebrow ? (
              <p className="eyebrow-light mb-8">{data.eyebrow}</p>
            ) : null}
            {data.quote ? (
              <p className="text-xl md:text-2xl font-light italic leading-[1.6]">
                {data.quote}
              </p>
            ) : null}
            {data.attribution ? (
              <p className="mt-6 text-[0.7rem] tracking-[0.32em] uppercase text-white/70">
                {data.attribution}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <DarkBreak
      bgImage={bg}
      eyebrow={data.eyebrow || undefined}
      quote={data.quote || undefined}
      attribution={data.attribution || undefined}
    />
  );
}

// ────────────────────────────────────────────────────────────── CTA BAND
type CtaBandData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  body?: string;
  primary?: { label?: string; href?: string };
  secondary?: { label?: string; href?: string };
}>;

export async function CtaBandBlock({ data }: { data: CtaBandData }) {
  const w = data.wrapper ?? {};
  const bg = w.backgroundImage
    ? await resolveImageUrl(w.backgroundImage, {
        fallback: "",
        crop: "wide",
        width: 2560,
      })
    : "";

  // Theme drives the band color so this block can act as either a
  // dramatic photo/navy CTA (default) OR a quiet text-only break
  // section that maintains the page's photo↔text rhythm.
  //   • theme="navy" (default) → dark navy band, white text
  //   • theme="cream" → cream band, navy text (visually a "plain" break)
  //   • theme="white" → white band, navy text
  const theme = (w.theme ?? "navy") as "navy" | "cream" | "white" | "transparent";
  const isDark = theme === "navy";
  const sectionClass = isDark
    ? "relative bg-navy text-white"
    : theme === "white"
      ? "relative bg-white text-ink"
      : "relative bg-cream-soft text-ink";
  // textColor: only attach an override class when admin explicitly
  // sets light/dark. In auto mode we let the block's own hardcoded
  // text classes (text-white on navy, text-ink on cream/white) win
  // so inner glass-* cards stay readable.
  const textClass =
    w.textColor === "light"
      ? "section-text-light"
      : w.textColor === "dark"
        ? "section-text-dark"
        : "";
  const eyebrowClass = isDark ? "eyebrow-light" : "eyebrow";
  const bodyClass = isDark ? "text-white/85" : "text-ink/75";
  const dividerClass = isDark ? "bg-white/40" : "bg-navy/40";

  return (
    <section className={`${sectionClass} ${textClass} py-24 md:py-32 gutter-x overflow-hidden`}>
      {/* Background photo only renders on dark themes — on cream/white
          the band is intentionally a quiet plain section. */}
      {bg && isDark ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url('${bg}')` }}
        />
      ) : null}
      <div className="relative max-w-3xl mx-auto text-center">
        {data.eyebrow ? <p className={`${eyebrowClass} mb-8`}>{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className={`heading-section mb-10 ${isDark ? "" : "text-ink"}`}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        <div className={`mx-auto mb-10 w-12 h-px ${dividerClass}`} />
        {data.body ? (
          <p className={`text-base md:text-lg font-light leading-[1.9] ${bodyClass} max-w-xl mx-auto mb-14`}>
            {data.body}
          </p>
        ) : null}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
          {data.primary?.label && data.primary?.href ? (
            <Link
              href={data.primary.href}
              className={
                isDark
                  ? "btn-glass"
                  : "inline-flex items-center px-9 py-4 bg-navy text-white text-[0.72rem] tracking-[0.28em] uppercase font-light hover:bg-navy-dark transition-all duration-500"
              }
            >
              {data.primary.label}
            </Link>
          ) : null}
          {data.secondary?.label && data.secondary?.href ? (
            <Link
              href={data.secondary.href}
              className={
                isDark
                  ? "px-9 py-4 border border-white/50 text-[0.72rem] tracking-[0.28em] uppercase font-light hover:bg-white hover:text-navy transition-all duration-500"
                  : "px-9 py-4 border border-navy/40 text-ink text-[0.72rem] tracking-[0.28em] uppercase font-light hover:bg-navy hover:text-white transition-all duration-500"
              }
            >
              {data.secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────── BOTTOM SIGN-OFF
type BottomSignoffData = WithWrapper<{ text?: string }>;

export async function BottomSignoffBlock({ data }: { data: BottomSignoffData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <p className="text-center text-base md:text-lg font-light italic text-ink/70">
        {data.text}
      </p>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── QUOTE PULL-QUOTE
type QuotePullquoteData = WithWrapper<{
  eyebrow?: string;
  quote?: string;
  attribution?: string;
}>;

export async function QuotePullquoteBlock({ data }: { data: QuotePullquoteData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="max-w-3xl mx-auto text-center">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.quote ? (
          <p
            className="text-2xl md:text-3xl font-light italic leading-[1.5] text-ink"
            style={{ fontWeight: 300 }}
          >
            “{data.quote}”
          </p>
        ) : null}
        {data.attribution ? (
          <p className="mt-8 text-[0.7rem] tracking-[0.32em] uppercase text-ink-muted">
            {data.attribution}
          </p>
        ) : null}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── VIDEO EMBED
type VideoEmbedData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  videoUrl?: string;
  caption?: string;
}>;

export async function VideoEmbedBlock({ data }: { data: VideoEmbedData }) {
  const ytId = data.videoUrl ? parseYouTubeId(data.videoUrl) : null;
  if (!ytId) return null;
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-4xl mx-auto">
        {data.eyebrow ? (
          <p className="eyebrow mb-6 text-center">{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink mb-10 text-center"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title=""
            className="w-full h-full"
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {data.caption ? (
          <p className="mt-6 text-sm md:text-base font-light text-ink/75 text-center max-w-2xl mx-auto">
            {data.caption}
          </p>
        ) : null}
      </div>
    </BlockShell>
  );
}
