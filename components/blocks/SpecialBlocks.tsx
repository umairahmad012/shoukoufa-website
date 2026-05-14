/**
 * Special blocks — wrap existing data-driven feature components and
 * embed them in the block-builder system. Each pulls from its own DB
 * tables (communities / reviews / closings / partners) so admin edits
 * in those areas still flow through.
 */
import Link from "next/link";
import BlockShell from "./BlockShell";
import { getCommunities } from "@/lib/communitiesLoader";
import { getReviews } from "@/lib/reviewsLoader";
import { getClosings } from "@/lib/closingsLoader";
import { site } from "@/lib/site";
import ClosingsGalleryClient from "@/components/ClosingsGalleryClient";
import type { BlockWrapper } from "@/lib/blockRegistry";
import { tc } from "@/lib/textColor";

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── COMMUNITY GRID
type CommunityGridData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  subtitle?: string;
  subtitleColor?: string;
}>;

export async function CommunityGridBlock({ data }: { data: CommunityGridData }) {
  const items = await getCommunities();
  return (
    <BlockShell wrapper={{ theme: "cream", ...(data.wrapper ?? {}) }}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-8", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink mb-8", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        <div className="mx-auto mb-8 w-12 h-px bg-navy/40" />
        {data.subtitle ? (
          <p
            className={tc(
              "text-base md:text-lg font-light text-ink/75 leading-[1.9]",
              data.subtitleColor,
            )}
          >
            {data.subtitle}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/communities/${c.slug}`}
            className="group relative aspect-[4/3.2] block overflow-hidden bg-navy-dark"
          >
            {/* Photo background.
                bg-position is shifted to the top 30% so the subject of
                the photo (sky/architecture) stays visible above the
                glass panel that anchors at the bottom of the card. */}
            <div
              className="absolute inset-0 bg-cover transition-transform duration-[1.6s] ease-editorial group-hover:scale-[1.05]"
              style={{
                backgroundImage: `url('${c.image}')`,
                backgroundPosition: "center 25%",
              }}
            />
            <div className="absolute inset-0 overlay-card" />

            {/* Frosted glass strip at the bottom — state header, name,
                and median / YoY / DOM stats. Larger padding + offset for
                better breathing room over the photo. */}
            <div className="absolute left-6 right-6 bottom-6 md:left-10 md:right-10 md:bottom-10 glass-dark p-6 md:p-10 text-white">
              <div className="flex items-baseline justify-between mb-3 md:mb-4">
                <p className="text-[0.62rem] md:text-[0.72rem] tracking-[0.32em] uppercase text-white/70">
                  {c.state}
                </p>
                <span className="inline-flex items-center gap-2 text-[0.55rem] md:text-[0.62rem] tracking-[0.30em] md:tracking-[0.32em] uppercase text-white/70 group-hover:text-white transition-colors">
                  Explore <span>↗</span>
                </span>
              </div>

              <h3
                className="text-2xl md:text-4xl uppercase tracking-wide mb-4 md:mb-6"
                style={{ fontWeight: 200, letterSpacing: "0.05em" }}
              >
                {c.name}
              </h3>

              <div className="grid grid-cols-3 gap-2 md:gap-4 pt-4 md:pt-5 border-t border-white/20">
                <div>
                  <p className="text-[0.52rem] md:text-[0.6rem] tracking-[0.24em] md:tracking-[0.28em] uppercase text-white/55 mb-1 md:mb-1.5">
                    Median
                  </p>
                  <p className="text-sm md:text-base font-light text-white">
                    {c.median}
                  </p>
                </div>
                <div>
                  <p className="text-[0.52rem] md:text-[0.6rem] tracking-[0.24em] md:tracking-[0.28em] uppercase text-white/55 mb-1 md:mb-1.5">
                    YoY
                  </p>
                  <p
                    className={`text-sm md:text-base font-light ${
                      c.yoyDirection === "up"
                        ? "text-emerald-300"
                        : c.yoyDirection === "down"
                          ? "text-rose-300"
                          : "text-white/85"
                    }`}
                  >
                    {c.yoy}
                  </p>
                </div>
                <div>
                  <p className="text-[0.52rem] md:text-[0.6rem] tracking-[0.24em] md:tracking-[0.28em] uppercase text-white/55 mb-1 md:mb-1.5">
                    DOM
                  </p>
                  <p className="text-sm md:text-base font-light text-white">
                    {c.dom}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── COMPARISON TABLE
type ComparisonTableData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  sourceNote?: string;
  sourceNoteColor?: string;
}>;

export async function ComparisonTableBlock({
  data,
}: {
  data: ComparisonTableData;
}) {
  const communities = await getCommunities();
  const sorted = [...communities].sort((a, b) => {
    const av =
      parseFloat(a.yoy.replace(/[^0-9.\-]/g, "")) *
      (a.yoyDirection === "down" ? -1 : 1);
    const bv =
      parseFloat(b.yoy.replace(/[^0-9.\-]/g, "")) *
      (b.yoyDirection === "down" ? -1 : 1);
    return bv - av;
  });
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-6", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink mb-6", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        {data.subtitle ? (
          <p
            className={tc(
              "text-base md:text-lg font-light text-ink/75 leading-[1.9] mb-3",
              data.subtitleColor,
            )}
          >
            {data.subtitle}
          </p>
        ) : null}
      </div>
      <div className="max-w-5xl mx-auto overflow-x-auto">
        <table className="w-full text-sm md:text-base text-left">
          <thead>
            <tr className="text-[0.65rem] tracking-[0.32em] uppercase text-ink-muted border-b border-ink/15">
              <th className="py-4 pr-6">Community</th>
              <th className="py-4 px-3 whitespace-nowrap">Median</th>
              <th className="py-4 px-3 whitespace-nowrap">YoY</th>
              <th className="py-4 px-3 whitespace-nowrap">DOM</th>
              <th className="py-4 pl-3 whitespace-nowrap">Market</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.slug} className="border-b border-ink/10">
                <td className="py-4 pr-6 font-light text-ink">{c.name}</td>
                <td className="py-4 px-3 text-ink/85">{c.median}</td>
                <td
                  className={`py-4 px-3 ${
                    c.yoyDirection === "up"
                      ? "text-emerald-700"
                      : c.yoyDirection === "down"
                        ? "text-rose-700"
                        : "text-ink/65"
                  }`}
                >
                  {c.yoy}
                </td>
                <td className="py-4 px-3 text-ink/85">{c.dom}</td>
                <td className="py-4 pl-3 text-ink/85">{c.marketType}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.sourceNote ? (
          <p className={tc("mt-6 text-xs italic text-ink-muted", data.sourceNoteColor)}>
            {data.sourceNote}
          </p>
        ) : null}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── REVIEWS STRIP (featured)
type ReviewsStripData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
}>;

export async function ReviewsStripBlock({ data }: { data: ReviewsStripData }) {
  const reviews = await getReviews({ onlyHomepage: true });
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-14">
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
        {reviews.map((r, i) => (
          <figure
            key={i}
            className="glass-light p-7 md:p-9 flex flex-col h-full"
          >
            <p className="text-amber-500 text-lg mb-4" style={{ letterSpacing: "0.1em" }}>
              ★★★★★
            </p>
            <blockquote className="text-sm md:text-base font-light leading-[1.85] text-ink/85 flex-1">
              “{r.quote}”
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-navy/15 text-[0.65rem] tracking-[0.32em] uppercase text-ink-muted">
              {r.short ?? ""} · <span className="text-navy">{r.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── REVIEWS FULL
export async function ReviewsFullBlock({ data }: { data: WithWrapper<Record<string, unknown>> }) {
  const reviews = await getReviews({ onlyHomepage: false });
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
        {reviews.map((r, i) => (
          <figure key={i} className="glass-light p-7 md:p-9 flex flex-col h-full">
            <p className="text-amber-500 text-lg mb-4" style={{ letterSpacing: "0.1em" }}>
              ★★★★★
            </p>
            <blockquote className="text-sm md:text-base font-light leading-[1.85] text-ink/85 flex-1">
              “{r.quote}”
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-navy/15 text-[0.65rem] tracking-[0.32em] uppercase text-ink-muted">
              {r.short ?? ""} · <span className="text-navy">{r.source}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── CLOSINGS GRID
type ClosingsGridData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  subtitle?: string;
  subtitleColor?: string;
  /** "preview" = first 6 with "See All Closings" CTA (homepage); "full" = all + Load More (/closings). */
  mode?: "preview" | "full";
}>;

export async function ClosingsGridBlock({ data }: { data: ClosingsGridData }) {
  const items = await getClosings();
  const preview = data.mode === "preview";
  return (
    <BlockShell wrapper={data.wrapper}>
      <ClosingsGalleryClient
        items={items}
        preview={preview}
        content={{
          eyebrow: data.eyebrow || "",
          eyebrowColor: data.eyebrowColor,
          heading: data.heading || "",
          headingColor: data.headingColor,
          subtitle: data.subtitle || "",
          subtitleColor: data.subtitleColor,
        }}
      />
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── PARTNERS DIRECTORY
type PartnersDirectoryData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
  intro?: string;
  introColor?: string;
  disclaimer?: string;
  disclaimerColor?: string;
}>;

export async function PartnersDirectoryBlock({
  data,
}: {
  data: PartnersDirectoryData;
}) {
  // Partners table read — minimal direct query so we don't need a new loader
  const { getServiceClient } = await import("@/lib/contentLoader");
  const supabase = getServiceClient();
  type PartnerRow = {
    id: string;
    category: string;
    name: string;
    role: string | null;
    company: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    display_order: number;
  };
  const rows: PartnerRow[] =
    (supabase
      ? (
          await supabase
            .from("partners")
            .select(
              "id, category, name, role, company, phone, email, notes, display_order",
            )
            .order("display_order")
        ).data as PartnerRow[] | null
      : null) ?? [];
  // Group by category
  const grouped: Record<string, PartnerRow[]> = {};
  for (const r of rows) (grouped[r.category] ||= []).push(r);

  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-12">
        {data.eyebrow ? (
          <p className={tc("eyebrow mb-8", data.eyebrowColor)}>{data.eyebrow}</p>
        ) : null}
        {data.heading ? (
          <h2
            className={tc("heading-section text-ink mb-8", data.headingColor)}
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        {data.intro ? (
          <p
            className={tc(
              "text-base md:text-lg font-light text-ink/75 leading-[1.9]",
              data.introColor,
            )}
          >
            {data.intro}
          </p>
        ) : null}
      </div>
      <div className="space-y-16 max-w-5xl mx-auto">
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h3
              className="text-lg uppercase mb-8 text-ink"
              style={{ fontWeight: 400, letterSpacing: "0.1em" }}
            >
              {cat}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {list.map((p) => (
                <div key={p.id} className="glass-light p-7">
                  <p
                    className="text-lg text-ink mb-1"
                    style={{ fontWeight: 400 }}
                  >
                    {p.name}
                  </p>
                  {p.role || p.company ? (
                    <p className="text-sm text-ink/70 mb-3">
                      {[p.role, p.company].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {p.phone ? (
                    <p className="text-sm text-ink/85">
                      <a href={`tel:${p.phone}`}>{p.phone}</a>
                    </p>
                  ) : null}
                  {p.email ? (
                    <p className="text-sm text-ink/85">
                      <a href={`mailto:${p.email}`}>{p.email}</a>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {data.disclaimer ? (
        <p
          className={tc(
            "mt-16 max-w-2xl mx-auto text-xs italic text-ink-muted text-center",
            data.disclaimerColor,
          )}
        >
          {data.disclaimer}
        </p>
      ) : null}
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── DIRECT CONTACT
type DirectContactData = WithWrapper<{
  eyebrow?: string;
  eyebrowColor?: string;
  heading?: string;
  headingColor?: string;
}>;

export async function DirectContactBlock({ data }: { data: DirectContactData }) {
  return (
    <BlockShell wrapper={data.wrapper} narrow>
      <div className="text-center mb-12">
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
      <div className="text-center space-y-3 text-lg font-light text-ink/85">
        <p>
          <a href={site.phoneHref} className="hover:opacity-70">
            {site.phone}
          </a>
        </p>
        <p>
          <a href={site.emailHref} className="hover:opacity-70">
            {site.email}
          </a>
        </p>
        <p className="text-[0.65rem] tracking-[0.32em] uppercase text-ink-muted mt-6">
          Licensed in VA {site.licenses.md ? "· MD" : ""}{" "}
          {(site.licenses as { dc?: string }).dc ? "· DC" : ""}
        </p>
      </div>
    </BlockShell>
  );
}
