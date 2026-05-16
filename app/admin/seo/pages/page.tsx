import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import {
  getAllPageMeta,
  getSiteSettings,
  buildFallbackPageMeta,
} from "@/lib/siteSettings";
import PageMetaEditor from "@/components/admin/seo/PageMetaEditor";

/**
 * Per-page SEO editor — the long-promised "Soon" card on /admin/seo.
 *
 * For each of the 10 fixed public pages, admins can override the
 * title and meta description that Google sees. Leaving a field blank
 * uses the agent-aware fallback (computed live from site_settings),
 * which is what fresh clones of this site get for free until the new
 * agent decides to override.
 */

// Fixed pages this editor manages. Each maps to a public URL plus a
// short label used for grouping. The order matches the order of the
// fixed-nav so the editor reads top-to-bottom like the site.
const PAGES: Array<{ key: string; label: string; href: string }> = [
  { key: "home", label: "Home", href: "/" },
  { key: "about", label: "About", href: "/about" },
  { key: "buyers", label: "Buyers", href: "/buyers" },
  { key: "sellers", label: "Sellers", href: "/sellers" },
  { key: "invest", label: "Invest", href: "/invest" },
  { key: "communities", label: "Communities", href: "/communities" },
  { key: "closings", label: "Recent Closings", href: "/closings" },
  { key: "partners", label: "Trusted Partners", href: "/partners" },
  { key: "reviews", label: "Reviews", href: "/reviews" },
  { key: "contact", label: "Contact", href: "/contact" },
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
];

export const dynamic = "force-dynamic";

export default async function SeoPagesEditor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [rows, settings] = await Promise.all([
    getAllPageMeta(),
    getSiteSettings(),
  ]);

  // Index rows by key for O(1) lookup in the render below.
  const byKey = new Map(rows.map((r) => [r.page_key, r]));

  // Pre-compute fallbacks server-side so the editor can show them as
  // placeholders / "use default" affordances without a round-trip.
  const items = PAGES.map((p) => {
    const row = byKey.get(p.key);
    const fallback = buildFallbackPageMeta(p.key, settings);
    return {
      key: p.key,
      label: p.label,
      href: p.href,
      currentTitle: row?.title ?? "",
      currentDescription: row?.description ?? "",
      fallbackTitle: fallback.title,
      fallbackDescription: fallback.description,
    };
  });

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <div className="max-w-4xl mx-auto py-8">
        <Link
          href="/admin/seo"
          className="inline-flex items-center gap-1.5 text-xs mb-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={14} /> Back to SEO
        </Link>

        <p
          className="text-[0.65rem] tracking-[0.32em] uppercase mb-3"
          style={{ color: "var(--muted-foreground)", fontWeight: 600 }}
        >
          SEO · Per-page metadata
        </p>
        <h1
          className="text-2xl md:text-3xl mb-2"
          style={{
            color: "var(--foreground)",
            fontWeight: 600,
            letterSpacing: "0.005em",
          }}
        >
          Titles &amp; descriptions Google sees.
        </h1>
        <p
          className="text-sm max-w-2xl mb-10 leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          Each page can have its own SEO title (60 chars max) and meta
          description (160 chars max). Leave blank to use the smart
          fallback — built automatically from your brand name, role,
          and service area. Changes go live immediately.
        </p>

        <PageMetaEditor items={items} />
      </div>
    </AdminShell>
  );
}
