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

type WithWrapper<T> = T & { wrapper?: BlockWrapper };

// ────────────────────────────────────────────────────────────── COMMUNITY GRID
type CommunityGridData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  subtitle?: string;
}>;

export async function CommunityGridBlock({ data }: { data: CommunityGridData }) {
  const items = await getCommunities();
  return (
    <BlockShell wrapper={{ theme: "cream", ...(data.wrapper ?? {}) }}>
      <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink mb-8"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        <div className="mx-auto mb-8 w-12 h-px bg-navy/40" />
        {data.subtitle ? (
          <p className="text-base md:text-lg font-light text-ink/75 leading-[1.9]">
            {data.subtitle}
          </p>
        ) : null}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {items.map((c) => (
          <Link
            key={c.slug}
            href={`/communities/${c.slug}`}
            className="group relative aspect-[4/5] overflow-hidden glow-on-hover bg-navy-dark"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${c.image}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="relative z-10 h-full flex flex-col justify-end p-7 text-white">
              <p className="text-[0.65rem] tracking-[0.32em] uppercase text-white/70 mb-3">
                {c.state}
              </p>
              <h3
                className="text-2xl md:text-3xl uppercase mb-3"
                style={{ fontWeight: 200, letterSpacing: "0.06em" }}
              >
                {c.name}
              </h3>
              <p className="text-sm font-light text-white/85 italic">{c.tagline}</p>
              <div className="mt-6 inline-flex items-center text-[0.7rem] tracking-[0.32em] uppercase border-b border-white/40 pb-1 self-start group-hover:border-white transition-colors">
                Read more
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
  heading?: string;
  subtitle?: string;
  sourceNote?: string;
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
        {data.eyebrow ? <p className="eyebrow mb-6">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink mb-6"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        {data.subtitle ? (
          <p className="text-base md:text-lg font-light text-ink/75 leading-[1.9] mb-3">
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
          <p className="mt-6 text-xs italic text-ink-muted">{data.sourceNote}</p>
        ) : null}
      </div>
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── REVIEWS STRIP (featured)
type ReviewsStripData = WithWrapper<{ eyebrow?: string; heading?: string }>;

export async function ReviewsStripBlock({ data }: { data: ReviewsStripData }) {
  const reviews = await getReviews({ onlyHomepage: true });
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-14">
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
  heading?: string;
  subtitle?: string;
  cta?: { label?: string; href?: string };
}>;

export async function ClosingsGridBlock({ data }: { data: ClosingsGridData }) {
  const items = await getClosings();
  return (
    <BlockShell wrapper={data.wrapper}>
      <div className="max-w-3xl mx-auto text-center mb-14">
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink mb-6"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        {data.subtitle ? (
          <p className="text-base md:text-lg font-light text-ink/75 leading-[1.9]">
            {data.subtitle}
          </p>
        ) : null}
      </div>
      <ClosingsGalleryClient
        items={items}
        content={{
          eyebrow: data.eyebrow || "",
          heading: data.heading || "",
          subtitle: data.subtitle || "",
        }}
      />
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── PARTNERS DIRECTORY
type PartnersDirectoryData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
  intro?: string;
  disclaimer?: string;
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
        {data.eyebrow ? <p className="eyebrow mb-8">{data.eyebrow}</p> : null}
        {data.heading ? (
          <h2
            className="heading-section text-ink mb-8"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}
          >
            {data.heading}
          </h2>
        ) : null}
        {data.intro ? (
          <p className="text-base md:text-lg font-light text-ink/75 leading-[1.9]">
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
        <p className="mt-16 max-w-2xl mx-auto text-xs italic text-ink-muted text-center">
          {data.disclaimer}
        </p>
      ) : null}
    </BlockShell>
  );
}

// ────────────────────────────────────────────────────────────── DIRECT CONTACT
type DirectContactData = WithWrapper<{
  eyebrow?: string;
  heading?: string;
}>;

export async function DirectContactBlock({ data }: { data: DirectContactData }) {
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
