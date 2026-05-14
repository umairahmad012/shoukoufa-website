/**
 * /admin/pages — list custom pages + create-new entry point.
 *
 * Each row links to the Page Builder for that page so admins go
 * straight to composing blocks after creating the page shell.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import { getAllCustomPages } from "@/lib/customPages";
import PagesListClient from "@/components/admin/pages/PagesListClient";

export const dynamic = "force-dynamic";

export default async function CustomPagesIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const pages = await getAllCustomPages();

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <PagesListClient initialPages={pages} />
    </AdminShell>
  );
}
