"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NavEntry } from "@/lib/siteSettings";

type SettingsPatch = {
  phone?: string;
  phone_href?: string;
  email?: string;
  email_href?: string;
  brokerage_office_name?: string;
  brokerage_office_street?: string;
  brokerage_office_city_state_zip?: string;
  brokerage_office_phone?: string;
  brokerage_office_phone_href?: string;
  license_va?: string;
  license_md?: string;
  license_dc?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  fixed_nav?: NavEntry[];
  // Footer copy (admin-editable at /admin/settings → Footer Copy)
  footer_copyright?: string;
  footer_credit?: string;
  footer_newsletter_headline?: string;
  footer_newsletter_blurb?: string;
};

export async function updateSiteSettings(
  patch: SettingsPatch,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update(patch)
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  // Site settings affect every page — invalidate everything
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePageMeta(input: {
  page_key: string;
  title: string;
  description?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_meta")
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
    })
    .eq("page_key", input.page_key);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/${input.page_key === "home" ? "" : input.page_key}`);
  revalidatePath(`/admin/settings`);
  return { ok: true };
}
