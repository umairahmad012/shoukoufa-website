/**
 * Support tickets — types and DB helpers.
 *
 * Tickets are submitted from `/admin/support` (multi-step wizard) and
 * trigger an email to Brand Bonjour plus a receipt copy to the submitter.
 * Status is admin-editable from the ticket detail page; either side can
 * mark a ticket resolved.
 */
import { createClient } from "@supabase/supabase-js";

/** Category radio options shown in step 1 of the wizard. */
export const SUPPORT_CATEGORIES = [
  { value: "edit_text", label: "Edit text on a page", icon: "✏️" },
  { value: "change_image", label: "Change/upload an image", icon: "🖼️" },
  { value: "closing", label: "Add or fix a closing", icon: "🏡" },
  { value: "seo", label: "SEO (page titles, descriptions)", icon: "🔍" },
  { value: "settings", label: "Settings (phone, email, social, licenses)", icon: "☎️" },
  { value: "bug", label: "Something is broken", icon: "🐛" },
  { value: "feature", label: "Feature request", icon: "✨" },
  { value: "training", label: "How do I…? (training)", icon: "🎓" },
  { value: "other", label: "Other", icon: "❓" },
] as const;
export type SupportCategoryValue = (typeof SUPPORT_CATEGORIES)[number]["value"];

/** Common pages the realtor might reference. Free-form override allowed. */
export const SUPPORT_PAGES = [
  { value: "home", label: "Home (/)" },
  { value: "about", label: "About (/about)" },
  { value: "buyers", label: "Buyers (/buyers)" },
  { value: "sellers", label: "Sellers (/sellers)" },
  { value: "invest", label: "Invest (/invest)" },
  { value: "communities", label: "Communities (/communities)" },
  { value: "closings", label: "Recent Closings (/closings)" },
  { value: "reviews", label: "Reviews (/reviews)" },
  { value: "partners", label: "Partners (/partners)" },
  { value: "contact", label: "Contact (/contact)" },
  { value: "privacy", label: "Privacy (/privacy)" },
  { value: "admin", label: "Admin panel" },
  { value: "site_wide", label: "Site-wide / multiple pages" },
] as const;

export const SUPPORT_URGENCIES = [
  { value: "low", label: "Low — whenever you can get to it" },
  { value: "normal", label: "Normal — within a day or two" },
  { value: "urgent", label: "Urgent — something is broken / live issue" },
] as const;
export type SupportUrgencyValue = (typeof SUPPORT_URGENCIES)[number]["value"];

export const SUPPORT_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "replied", label: "Replied" },
  { value: "resolved", label: "Resolved" },
] as const;
export type SupportStatusValue = (typeof SUPPORT_STATUSES)[number]["value"];

/** One attachment row stored in support_tickets.attachments[]. */
export type TicketAttachment = {
  media_id?: string;
  url?: string;
  alt?: string;
  name?: string;
};

/** A ticket row as it lives in the DB. */
export type SupportTicket = {
  id: string;
  ticket_number: string;
  category: SupportCategoryValue;
  affected_page: string | null;
  description: string;
  urgency: SupportUrgencyValue;
  attachments: TicketAttachment[];
  submitter_email: string;
  submitter_name: string | null;
  status: SupportStatusValue;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

/** Friendly label for a category value. */
export function categoryLabel(value: string): string {
  return (
    SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value
  );
}

/** Friendly label for an urgency value. */
export function urgencyLabel(value: string): string {
  return SUPPORT_URGENCIES.find((u) => u.value === value)?.label ?? value;
}

/** Friendly label for a status value. */
export function statusLabel(value: string): string {
  return SUPPORT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

/**
 * Service-role Supabase client. Used by server-only code paths
 * (server actions) that need to bypass RLS or call SECURITY DEFINER
 * functions. Lazy-initialised so module load doesn't crash when env
 * vars are missing.
 */
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** List every ticket (newest first), for /admin/support/tickets. */
export async function listSupportTickets(): Promise<SupportTicket[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listSupportTickets:", error.message);
    return [];
  }
  return (data ?? []) as SupportTicket[];
}

/** Fetch one ticket by id; null if not found. */
export async function getSupportTicket(id: string): Promise<SupportTicket | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getSupportTicket:", error.message);
    return null;
  }
  return (data as SupportTicket | null) ?? null;
}

/**
 * Pull the next ticket number with the given prefix. Calls the
 * SECURITY DEFINER function in the DB so the sequence value is
 * atomically grabbed.
 */
export async function nextTicketNumber(prefix: string): Promise<string | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("next_support_ticket_number", {
    p_prefix: prefix,
  });
  if (error) {
    console.error("nextTicketNumber:", error.message);
    return null;
  }
  return (data as string | null) ?? null;
}
