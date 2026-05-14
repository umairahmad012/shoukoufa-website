/**
 * Admin → Site Settings — edit phone/email/social/licenses/office and
 * the fixed-nav configuration (which routes appear, in what order).
 *
 * Page metadata (title + description per fixed page) is also editable
 * here in a separate tab.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import { getSiteSettings, getAllPageMeta } from "@/lib/siteSettings";
import SettingsClient from "@/components/admin/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [settings, pageMeta] = await Promise.all([
    getSiteSettings(),
    getAllPageMeta(),
  ]);

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <SettingsClient
        initialSettings={settings}
        initialPageMeta={pageMeta}
      />
    </AdminShell>
  );
}
