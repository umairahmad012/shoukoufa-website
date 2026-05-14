"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { extractCommon, type FormField } from "@/lib/forms";
import { sendLeadNotification } from "@/lib/emailNotifications";

type Result = { ok: true; id?: string; slug?: string } | { ok: false; error: string };

export type FormInput = {
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  submit_label: string;
  success_message: string;
  notify_email: string | null;
  is_published: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function upsertForm(
  input: FormInput,
  existingId?: string,
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const payload = {
    ...input,
    fields: input.fields,
    updated_at: new Date().toISOString(),
  };

  const query = existingId
    ? supabase.from("forms").update(payload).eq("id", existingId)
    : supabase.from("forms").insert(payload);

  const { error } = await query.select("id").single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/forms");
  revalidatePath(`/admin/forms/${input.slug}`);
  revalidatePath(`/form/${input.slug}`);
  return { ok: true, slug: input.slug };
}

export async function deleteForm(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("forms").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/forms");
  return { ok: true };
}

/**
 * Public submit handler — called from the /form/[slug] renderer.
 * Anon-allowed via RLS policy ("anyone can submit leads").
 */
export async function submitFormPublic(input: {
  formId: string;
  source: string;
  data: Record<string, unknown>;
}): Promise<Result> {
  // Use the service-role client so no auth session is required for the insert
  const supabase = createServiceClient();
  const common = extractCommon(input.data);

  const { error } = await supabase.from("leads").insert({
    source: input.source,
    form_id: input.formId,
    data: input.data,
    name: common.name,
    email: common.email,
    phone: common.phone,
    message: common.message,
    status: "new",
  });
  if (error) return { ok: false, error: error.message };

  // Look up the form title for a nicer email subject line. Tolerate
  // missing rows so a corrupt form_id still allows the submission.
  let formTitle: string | null = null;
  try {
    const { data: form } = await supabase
      .from("forms")
      .select("title")
      .eq("id", input.formId)
      .maybeSingle();
    formTitle = (form as { title?: string } | null)?.title ?? null;
  } catch {
    /* non-fatal */
  }

  // Fire the email notification but don't block the response on it.
  // Failures are logged server-side; the visitor still sees success.
  void sendLeadNotification({
    source: input.source,
    formTitle,
    data: input.data,
    name: common.name,
    email: common.email,
    phone: common.phone,
    message: common.message,
  }).then((r) => {
    if (!r.ok && r.reason === "send-failed") {
      console.error("[lead-notify]", r.error);
    }
  });

  revalidatePath("/admin/inbox");
  return { ok: true };
}

/**
 * Anonymous-public submit for the built-in (non-builder) forms like /contact
 * and the sellers valuation. Doesn't require a `forms` row — just a source
 * label and the raw payload.
 */
export async function submitBuiltInForm(input: {
  source: string;
  data: Record<string, unknown>;
}): Promise<Result> {
  const supabase = createServiceClient();
  const common = extractCommon(input.data);
  const { error } = await supabase.from("leads").insert({
    source: input.source,
    form_id: null,
    data: input.data,
    name: common.name,
    email: common.email,
    phone: common.phone,
    message: common.message,
    status: "new",
  });
  if (error) return { ok: false, error: error.message };

  void sendLeadNotification({
    source: input.source,
    data: input.data,
    name: common.name,
    email: common.email,
    phone: common.phone,
    message: common.message,
  }).then((r) => {
    if (!r.ok && r.reason === "send-failed") {
      console.error("[lead-notify]", r.error);
    }
  });

  revalidatePath("/admin/inbox");
  return { ok: true };
}

export async function setLeadStatus(
  id: string,
  status: "new" | "in-progress" | "closed",
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/inbox");
  return { ok: true };
}
