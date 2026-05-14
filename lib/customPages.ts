/**
 * Custom pages — admin-created marketing pages at /<slug>.
 *
 * Storage: `pages` table. Slug is the primary key and is also used as
 * the `page_key` in page_blocks.
 *
 * Reserved slugs (existing route folders + shells) are not allowed and
 * are enforced in `validateSlug` below. Keep this list in sync with
 * `app/` folder names.
 */
import { getServiceClient } from "./contentLoader";

export type CustomPage = {
  slug: string;
  title: string;
  description: string | null;
  published: boolean;
  show_in_nav: boolean;
  nav_order: number;
  created_at: string;
  updated_at: string;
};

/**
 * Slugs claimed by existing route folders / system routes. Cannot be
 * used for custom pages. Compared case-insensitively.
 */
export const RESERVED_SLUGS: ReadonlyArray<string> = [
  // Top-level static pages already in the site
  "admin",
  "api",
  "about",
  "buyers",
  "sellers",
  "invest",
  "communities",
  "closings",
  "reviews",
  "partners",
  "contact",
  "privacy",
  "leave-review",
  "leave-review-internal",
  "form",
  "open-house",
  "realtor-in",
  // System routes / metadata
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "icon",
  "_next",
];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(input: string): { ok: true; slug: string } | { ok: false; error: string } {
  const s = input.trim().toLowerCase();
  if (!s) return { ok: false, error: "Slug is required." };
  if (!SLUG_PATTERN.test(s))
    return {
      ok: false,
      error:
        "Slug must be lowercase letters, numbers, and hyphens only — no spaces, slashes, or symbols.",
    };
  if (RESERVED_SLUGS.includes(s))
    return {
      ok: false,
      error: `"${s}" is reserved by an existing route. Pick a different slug.`,
    };
  if (s.length > 80) return { ok: false, error: "Slug is too long (max 80 chars)." };
  return { ok: true, slug: s };
}

/** All custom pages (admin view — includes drafts). */
export async function getAllCustomPages(): Promise<CustomPage[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("pages")
    .select("*")
    .order("nav_order", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as CustomPage[] | null) ?? [];
}

/** Single custom page by slug (any state). */
export async function getCustomPage(slug: string): Promise<CustomPage | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as CustomPage | null) ?? null;
}

/** Only published custom pages — used by the public site. */
export async function getPublishedCustomPages(): Promise<CustomPage[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("published", true)
    .order("nav_order", { ascending: true });
  return (data as CustomPage[] | null) ?? [];
}

/** Pages that should appear in the header nav. Published only. */
export async function getNavPages(): Promise<CustomPage[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("pages")
    .select("*")
    .eq("published", true)
    .eq("show_in_nav", true)
    .order("nav_order", { ascending: true });
  return (data as CustomPage[] | null) ?? [];
}
