import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import FormBuilder from "@/components/admin/forms/FormBuilder";
import type { FormInput } from "@/app/admin/forms/actions";
import type { FormField } from "@/lib/forms";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: row } = await supabase
    .from("forms")
    .select(
      "id, slug, title, description, fields, submit_label, success_message, notify_email, is_published",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!row) notFound();

  const initial: FormInput = {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    fields: Array.isArray(row.fields) ? (row.fields as FormField[]) : [],
    submit_label: row.submit_label ?? "Submit",
    success_message: row.success_message ?? "Thanks — we'll be in touch shortly.",
    notify_email: row.notify_email ?? null,
    is_published: row.is_published ?? true,
  };

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <FormBuilder existingId={row.id as string} initial={initial} />
    </AdminShell>
  );
}
