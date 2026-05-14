"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateSlug } from "@/lib/customPages";

export async function createPage(input: {
  slug: string;
  title: string;
  description?: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const sv = validateSlug(input.slug);
  if (!sv.ok) return sv;
  if (!input.title.trim()) return { ok: false, error: "Title is required." };

  const supabase = await createClient();

  // Check for collision with existing custom pages
  const { data: existing } = await supabase
    .from("pages")
    .select("slug")
    .eq("slug", sv.slug)
    .maybeSingle();
  if (existing)
    return {
      ok: false,
      error: `A page with slug "${sv.slug}" already exists.`,
    };

  const { error } = await supabase.from("pages").insert({
    slug: sv.slug,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    published: false,
    show_in_nav: false,
    nav_order: 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pages");
  return { ok: true, slug: sv.slug };
}

export async function updatePage(input: {
  slug: string;
  title?: string;
  description?: string;
  published?: boolean;
  show_in_nav?: boolean;
  nav_order?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined)
    patch.description = input.description.trim() || null;
  if (input.published !== undefined) patch.published = input.published;
  if (input.show_in_nav !== undefined) patch.show_in_nav = input.show_in_nav;
  if (input.nav_order !== undefined) patch.nav_order = input.nav_order;
  const { error } = await supabase
    .from("pages")
    .update(patch)
    .eq("slug", input.slug);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pages");
  revalidatePath(`/${input.slug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deletePage(input: {
  slug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  // Delete blocks first
  await supabase.from("page_blocks").delete().eq("page_key", input.slug);
  const { error } = await supabase.from("pages").delete().eq("slug", input.slug);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/pages");
  revalidatePath("/");
  return { ok: true };
}
