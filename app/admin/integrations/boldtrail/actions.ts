"use server";

/**
 * Boldtrail (kvCORE) integration — small set of server actions.
 *
 * "Integration" here means the long-lived JWT issued in Boldtrail
 * Settings → Integrations → Lead Capture API, plus an optional
 * source-label override. Once saved, every form submission flow
 * (Contact, Valuation, Custom forms, Open-house RSVP) fires
 * sendBoldtrailLead() alongside the email notification.
 *
 * The key lives in `public.integrations.config.apiKey` (jsonb). RLS
 * prevents anon reads. The send path uses the SERVICE-ROLE client so
 * public form submissions can fire without an auth session.
 */

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  sendBoldtrailLead,
  sendBoldtrailTest,
  type BoldtrailResult,
} from "@/lib/boldtrail";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * Save (insert or update) the Boldtrail credential set. The user pastes
 * the JWT from Boldtrail; we trim and persist. We don't validate the
 * JWT signature here — Boldtrail will reject expired or malformed keys
 * on the first lead send, and the test button lets the admin verify
 * before relying on it.
 */
export async function saveBoldtrailIntegration(input: {
  apiKey: string;
  sourceLabel?: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const apiKey = input.apiKey?.trim() ?? "";
  if (!apiKey) {
    return {
      ok: false,
      error:
        "Paste the Lead Capture API key from Boldtrail (Settings → Integrations → Lead Capture API).",
    };
  }
  // Sanity check — Boldtrail keys are JWTs (three base64 segments).
  // We don't decode; just make sure it looks right enough to avoid
  // saving an obvious typo. Real validation happens on first send.
  if (apiKey.split(".").length !== 3) {
    return {
      ok: false,
      error:
        "That doesn't look like a Boldtrail Lead Capture key. It should be a long string with two dots in the middle.",
    };
  }

  const sourceLabel = input.sourceLabel?.trim() || null;

  const { error } = await supabase.from("integrations").upsert(
    {
      key: "boldtrail",
      config: { apiKey, ...(sourceLabel ? { sourceLabel } : {}) },
      enabled: true,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) return { ok: false, error: `Couldn't save: ${error.message}` };

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/integrations/boldtrail");
  return { ok: true };
}

/** Disable the integration without deleting the key — useful during
 *  a Boldtrail outage or while debugging deliverability without losing
 *  the credentials. */
export async function disconnectBoldtrail(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("integrations")
    .update({
      enabled: false,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "boldtrail");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/integrations/boldtrail");
  return { ok: true };
}

/** Re-enable after a `disconnectBoldtrail()` without re-pasting the key. */
export async function enableBoldtrail(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("integrations")
    .update({
      enabled: true,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "boldtrail");
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/integrations/boldtrail");
  return { ok: true };
}

/**
 * Manual test — fires a fake lead at Boldtrail's API using the saved
 * key. Surfaces the result back to the admin so they can verify
 * connectivity without waiting for a real visitor.
 *
 * Returns the raw BoldtrailResult so the UI can show success / error
 * detail (status code + message body) in a single click.
 */
export async function testBoldtrailIntegration(): Promise<BoldtrailResult> {
  const { user } = await requireUser();
  if (!user) {
    return { ok: false, error: "Not signed in.", reason: "not-configured" };
  }
  return sendBoldtrailTest();
}

/**
 * Admin-side helper: push a previously-saved Supabase lead to Boldtrail.
 * Useful when Boldtrail was down at the moment of submission and we
 * see the failure in the function logs — admins can re-fire from the
 * inbox page without asking the visitor to re-submit.
 */
export async function resendLeadToBoldtrail(leadId: string): Promise<BoldtrailResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { ok: false, error: "Not signed in.", reason: "not-configured" };
  }
  const { data } = await supabase
    .from("leads")
    .select("source, name, email, phone, message, data")
    .eq("id", leadId)
    .maybeSingle();
  if (!data) {
    return { ok: false, error: "Lead not found.", reason: "not-configured" };
  }
  // We import deriveLeadFromForm lazily so we don't pull lib/boldtrail
  // into a server-action bundle that only needs the test path.
  const { deriveLeadFromForm } = await import("@/lib/boldtrail");
  return sendBoldtrailLead(
    deriveLeadFromForm({
      source: (data as { source: string }).source,
      name: (data as { name?: string }).name ?? null,
      email: (data as { email?: string }).email ?? null,
      phone: (data as { phone?: string }).phone ?? null,
      message: (data as { message?: string }).message ?? null,
      data: (data as { data?: Record<string, unknown> }).data,
    }),
  );
}
