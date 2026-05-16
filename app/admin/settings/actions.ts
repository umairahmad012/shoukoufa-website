"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { NavEntry } from "@/lib/siteSettings";
import { sendTestNotification } from "@/lib/emailNotifications";

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
  // Email notifications (admin-editable at /admin/settings → Notifications)
  notification_email?: string;
  notification_cc?: string;
  notify_contact?: boolean;
  notify_valuation?: boolean;
  notify_forms?: boolean;
  notify_rsvp?: boolean;
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

/**
 * Upsert (not just update) so a freshly-cloned site — where the
 * page_meta table may be empty for some keys — still saves cleanly.
 * Empty title means "use the agent-aware fallback in
 * buildPageMetadata" — we represent that as a NULL title row OR no
 * row at all, both of which the fallback path treats the same.
 */
export async function updatePageMeta(input: {
  page_key: string;
  title: string;
  description?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const title = input.title.trim();
  const description = input.description?.trim() || null;
  // If both fields are empty, delete the row so the fallback generator
  // takes over cleanly. Saves admins from staring at a row labeled
  // "(empty)" and wondering whether the fallback is actually firing.
  if (!title && !description) {
    const { error } = await supabase
      .from("page_meta")
      .delete()
      .eq("page_key", input.page_key);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("page_meta")
      .upsert(
        {
          page_key: input.page_key,
          // Schema requires non-null title; if admin cleared the title
          // but kept a description, store the title as empty string —
          // buildPageMetadata treats empty as falsy and falls back.
          title: title || "",
          description,
        },
        { onConflict: "page_key" },
      );
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/${input.page_key === "home" ? "" : input.page_key}`);
  revalidatePath(`/admin/settings`);
  revalidatePath(`/admin/seo/pages`);
  return { ok: true };
}

/**
 * Fire a sample lead-notification email to the currently-saved
 * `notification_email`. Used by the "Send test email" button so the
 * admin can verify wiring before relying on real form submissions.
 */
export async function sendNotificationTest(): Promise<
  | { ok: true; id: string | null }
  | { ok: false; error: string; reason: string }
> {
  // Require auth so this can't be hammered from outside the admin panel.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in", reason: "auth" };

  const res = await sendTestNotification();
  if (res.ok) return { ok: true, id: res.id };
  return { ok: false, error: res.error, reason: res.reason };
}
