/**
 * Dynamic route for admin-created custom pages.
 *
 * Sits at app/[slug]/page.tsx. Next.js prefers explicit folder routes
 * (about/, buyers/, etc.) over this catch-all, so the existing top-
 * level pages keep working and only unmatched slugs land here.
 *
 * Lookup flow:
 *   1) Look up `slug` in the `pages` table
 *   2) If no row, or `published = false`, return 404
 *   3) Otherwise render <PageRenderer pageKey={slug} />
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PageRenderer from "@/components/blocks/PageRenderer";
import {
  getCustomPage,
  getPublishedCustomPages,
  RESERVED_SLUGS,
} from "@/lib/customPages";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.includes(slug.toLowerCase())) return {};
  const page = await getCustomPage(slug);
  if (!page || !page.published) return {};
  return {
    title: page.title,
    description: page.description ?? undefined,
    openGraph: {
      title: page.title,
      description: page.description ?? undefined,
    },
  };
}

/**
 * Statically pre-render published custom pages at build time so they
 * land instantly. Drafts still 404 because they're not in this list.
 */
export async function generateStaticParams() {
  const pages = await getPublishedCustomPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export default async function CustomPageRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  // Reserved slugs should already be handled by sibling folders, but
  // be defensive — a stray slug match would otherwise leak through.
  if (RESERVED_SLUGS.includes(slug.toLowerCase())) notFound();

  const page = await getCustomPage(slug);
  if (!page || !page.published) notFound();

  return <PageRenderer pageKey={slug} />;
}
