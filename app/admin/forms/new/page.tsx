import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import FormBuilder from "@/components/admin/forms/FormBuilder";
import type { FormInput } from "@/app/admin/forms/actions";

export default async function NewFormPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const initial: FormInput = {
    slug: "",
    title: "",
    description: "",
    fields: [
      { label: "Your name", name: "name", type: "text", required: true },
      { label: "Email", name: "email", type: "email", required: true },
      { label: "Phone", name: "phone", type: "phone" },
      { label: "Message", name: "message", type: "textarea", required: true },
    ],
    submit_label: "Submit",
    success_message: "Thanks — we'll be in touch shortly.",
    notify_email: null,
    is_published: true,
  };

  return (
    <AdminShell user={{ email: user.email ?? "" }}>
      <FormBuilder initial={initial} />
    </AdminShell>
  );
}
