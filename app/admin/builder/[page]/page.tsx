/**
 * Page Builder — admin view for a single page's block layout.
 *
 *   /admin/builder/home
 *   /admin/builder/about
 *   /admin/builder/<custom-slug>
 *   ...
 *
 * Renders a vertical list of blocks for the page. Each row has reorder
 * buttons, on/off toggle, block-type badge + content preview, and
 * Edit / Duplicate / Delete actions. Plus an "Add Block" picker grouped
 * by category.
 *
 * Pages come from two sources, merged into the dropdown:
 *   1) Fixed pages (home/about/buyers/...) defined below
 *   2) Custom pages from the `pages` table (admin-created via /admin/pages)
 */
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import { getPageBlocks } from "@/lib/pageBlocks";
import { getAllCustomPages, getCustomPage } from "@/lib/customPages";
import BuilderClient from "@/components/admin/builder/BuilderClient";
import type { VideoLibraryItem } from "@/components/admin/media/VideoPicker";

const FIXED_PAGES: Array<{ key: string; label: string; livePath: string }> = [
  { key: "home", label: "Homepage", livePath: "/" },
  { key: "about", label: "About", livePath: "/about" },
  { key: "buyers", label: "Buyers", livePath: "/buyers" },
  { key: "sellers", label: "Sellers", livePath: "/sellers" },
  { key: "invest", label: "Invest", livePath: "/invest" },
  { key: "communities", label: "Communities (Index)", livePath: "/communities" },
  { key: "closings", label: "Recent Closings", livePath: "/closings" },
  { key: "reviews", label: "Reviews", livePath: "/reviews" },
  { key: "partners", label: "Trusted Partners", livePath: "/partners" },
  { key: "contact", label: "Contact", livePath: "/contact" },
  { key: "privacy", label: "Privacy & Disclaimers", livePath: "/privacy" },
];

type Params = { page: string };

export const dynamic = "force-dynamic";

export default async function PageBuilderRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { page } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Merge fixed + custom pages for the dropdown
  const custom = await getAllCustomPages();
  const allPages = [
    ...FIXED_PAGES,
    ...custom.map((cp) => ({
      key: cp.slug,
      label: cp.title + (cp.published ? "" : " (draft)"),
      livePath: `/${cp.slug}`,
    })),
  ];

  // Resolve current page meta — fixed first, then custom
  const fixed = FIXED_PAGES.find((p) => p.key === page);
  let pageMeta = fixed;
  if (!pageMeta) {
    const cp = await getCustomPage(page);
    if (cp) {
      pageMeta = {
        key: cp.slug,
        label: cp.title,
        livePath: `/${cp.slug}`,
      };
    }
  }
  if (!pageMeta) notFound();

  const blocks = await getPageBlocks(page, { includeDisabled: true });

  // Media library for the image/video pickers inside the edit modal.
  const { data: media } = await supabase
    .from("media")
    .select("id, kind, cloudinary_public_id, url, alt")
    .order("uploaded_at", { ascending: false });

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <BuilderClient
        pageKey={pageMeta.key}
        pageLabel={pageMeta.label}
        livePath={pageMeta.livePath}
        pages={allPages}
        initialBlocks={blocks}
        library={(media ?? []) as VideoLibraryItem[]}
      />
    </AdminShell>
  );
}
