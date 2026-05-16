"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSiteSettings } from "@/lib/siteSettings";
import { siteOrigin } from "@/lib/qrcode";
import { sendTicketEmails } from "@/lib/supportEmail";
import {
  type SupportTicket,
  type SupportCategoryValue,
  type SupportUrgencyValue,
  type SupportStatusValue,
  type TicketAttachment,
  SUPPORT_CATEGORIES,
  SUPPORT_URGENCIES,
  SUPPORT_STATUSES,
  nextTicketNumber,
} from "@/lib/supportTickets";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

function isValidCategory(v: unknown): v is SupportCategoryValue {
  return (
    typeof v === "string" && SUPPORT_CATEGORIES.some((c) => c.value === v)
  );
}
function isValidUrgency(v: unknown): v is SupportUrgencyValue {
  return typeof v === "string" && SUPPORT_URGENCIES.some((u) => u.value === v);
}
function isValidStatus(v: unknown): v is SupportStatusValue {
  return typeof v === "string" && SUPPORT_STATUSES.some((s) => s.value === v);
}

/** Service-role client for inserts (bypass RLS — we trust requireAuth above). */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Verify the caller is signed in to the admin panel. */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export type SubmitTicketInput = {
  category: SupportCategoryValue;
  affected_page: string | null;
  description: string;
  urgency: SupportUrgencyValue;
  attachments: TicketAttachment[];
  submitter_name: string;
  submitter_email: string;
};

export async function submitSupportTicket(
  input: SubmitTicketInput,
): Promise<Result<SupportTicket>> {
  const user = await requireAdmin();
  if (!user) return { ok: false, error: "Not signed in" };

  // Validate
  if (!isValidCategory(input.category))
    return { ok: false, error: "Invalid category" };
  if (!isValidUrgency(input.urgency))
    return { ok: false, error: "Invalid urgency" };
  if (!input.description?.trim())
    return { ok: false, error: "Please describe what you need help with" };
  if (!input.submitter_email?.trim())
    return { ok: false, error: "Please provide an email to reply to" };
  if (!/.+@.+\..+/.test(input.submitter_email))
    return { ok: false, error: "Email looks invalid" };

  const settings = await getSiteSettings();
  const prefix = settings.supportTicketPrefix || "BB";
  const ticket_number = await nextTicketNumber(prefix);
  if (!ticket_number) {
    return { ok: false, error: "Could not allocate ticket number" };
  }

  const svc = serviceClient();
  const { data, error } = await svc
    .from("support_tickets")
    .insert({
      ticket_number,
      category: input.category,
      affected_page: input.affected_page?.trim() || null,
      description: input.description.trim(),
      urgency: input.urgency,
      attachments: input.attachments ?? [],
      submitter_name: input.submitter_name?.trim() || null,
      submitter_email: input.submitter_email.trim(),
      status: "open",
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message || "Insert failed" };
  }

  const ticket = data as SupportTicket;

  // Fire-and-don't-block on email — even if Resend has a hiccup, the ticket
  // is saved and visible in /admin/support/tickets.
  const origin = siteOrigin();
  try {
    const emailRes = await sendTicketEmails({
      ticket,
      realtorName: settings.name || "Website",
      siteOrigin: origin,
    });
    if (!emailRes.ok) {
      console.error("Ticket email failed:", emailRes.error);
    }
  } catch (e) {
    console.error("Ticket email exception:", e);
  }

  revalidatePath("/admin/support/tickets");
  revalidatePath("/admin/support");

  return { ok: true, data: ticket };
}

export async function updateTicketStatus(
  id: string,
  status: SupportStatusValue,
  resolutionNotes?: string | null,
): Promise<Result<SupportTicket>> {
  const user = await requireAdmin();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!isValidStatus(status))
    return { ok: false, error: "Invalid status" };

  const svc = serviceClient();
  const update: Record<string, unknown> = { status };
  if (typeof resolutionNotes === "string") {
    update.resolution_notes = resolutionNotes.trim() || null;
  }
  const { data, error } = await svc
    .from("support_tickets")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message || "Update failed" };
  }
  revalidatePath("/admin/support/tickets");
  revalidatePath(`/admin/support/tickets/${id}`);
  return { ok: true, data: data as SupportTicket };
}
