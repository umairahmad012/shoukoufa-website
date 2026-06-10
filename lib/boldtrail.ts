/**
 * Boldtrail (kvCORE) Lead Capture API client.
 *
 * Wraps a single POST https://api.kvcore.com/leads call so every form
 * submission server action can fire `sendBoldtrailLead(...)` next to
 * its existing `sendLeadNotification(...)` without knowing the wire
 * details.
 *
 * Auth shape (confirmed by probing in dev):
 *   - Bearer JWT in `Authorization` header.
 *   - Body: { first_name, last_name, email, phone, source, message } —
 *     email OR phone is required, all else optional.
 *   - On success the API returns `{ status: 200, lead: { ... }, savedLead: true }`
 *     and assigns the lead to the agent who issued the token. We don't
 *     need to read or persist Boldtrail's internal lead id here — the
 *     authoritative copy still lives in Supabase.
 *
 * Failure mode: NEVER throws.
 *   - No API key configured → returns { ok:false, reason:'not-configured' }
 *     silently. Caller treats as a no-op.
 *   - Integration disabled → ditto, reason:'disabled'.
 *   - Network or HTTP error → returns { ok:false, error, status }.
 *     Caller logs via console.error so Netlify function logs catch it
 *     for retry / debugging without losing the lead (which is already
 *     saved in Supabase by the time we run).
 *
 * Why no automatic retry: lead-capture endpoints are idempotent enough
 * that a duplicate hit creates a duplicate lead. Better to surface the
 * failure and have the admin re-push from /admin/inbox than to silently
 * double-fire.
 */

import { getIntegration, type BoldtrailConfig } from "./integrationStore";
import { siteOrigin } from "./qrcode";

export type BoldtrailLead = {
  /** Free-form source label (e.g. "contact", "valuation", "open-house"). Becomes
   *  visible in Boldtrail to help triage. We prepend the source label saved
   *  on the integration row, so admins can override the per-site display. */
  source: string;
  /** Best-effort name split from a single field, if that's all we have. */
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  /** Free address line — passed as part of the message body since
   *  Boldtrail's lead API doesn't take a structured address on create. */
  address?: string;
};

export type BoldtrailResult =
  | { ok: true; id: number | null }
  | { ok: false; error: string; reason: "not-configured" | "disabled" | "rejected" | "network" | "no-recipient"; status?: number };

const ENDPOINT = "https://api.kvcore.com/leads";

export async function sendBoldtrailLead(
  lead: BoldtrailLead,
): Promise<BoldtrailResult> {
  const integration = await getIntegration<BoldtrailConfig>("boldtrail");
  if (!integration) {
    return { ok: false, error: "Boldtrail not configured", reason: "not-configured" };
  }
  if (!integration.enabled) {
    return { ok: false, error: "Boldtrail disabled by admin", reason: "disabled" };
  }
  const apiKey = integration.config?.apiKey?.trim();
  if (!apiKey) {
    return { ok: false, error: "Boldtrail API key missing", reason: "not-configured" };
  }

  // Boldtrail requires at least an email OR a phone. If we have neither,
  // there's nothing to send — the lead is unreachable from their side.
  if (!lead.email?.trim() && !lead.phone?.trim()) {
    return { ok: false, error: "No email or phone on lead", reason: "no-recipient" };
  }

  const { firstName, lastName } = splitName(lead);
  // Compose the source label: admin-configured prefix + per-form source.
  // Example: "shoukoufahomes.com · contact". Keeps the leads triaged in
  // Boldtrail by the form that originated them.
  const adminLabel = integration.config?.sourceLabel?.trim() || siteOrigin().replace(/^https?:\/\//, "");
  const source = `${adminLabel} · ${lead.source}`;

  // Address goes into the message body since the create endpoint doesn't
  // accept structured address fields. This keeps property valuations and
  // open-house RSVPs from losing the location context.
  const messageParts: string[] = [];
  if (lead.message?.trim()) messageParts.push(lead.message.trim());
  if (lead.address?.trim()) messageParts.push(`Address: ${lead.address.trim()}`);
  const message = messageParts.join("\n\n") || undefined;

  const body: Record<string, unknown> = {
    source,
    email: lead.email?.trim() || undefined,
    phone: lead.phone?.trim() || undefined,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    message,
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // Boldtrail occasionally returns HTML on auth failure or maintenance;
      // we treat any non-JSON response with non-2xx as a rejection.
    }

    if (!res.ok) {
      return {
        ok: false,
        error: typeof parsed === "object" && parsed !== null
          ? JSON.stringify(parsed).slice(0, 500)
          : text.slice(0, 500),
        reason: "rejected",
        status: res.status,
      };
    }

    const id =
      parsed && typeof parsed === "object" && "lead" in parsed
        ? ((parsed as { lead?: { id?: number } }).lead?.id ?? null)
        : null;
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, reason: "network" };
  }
}

/**
 * Split a single-line "Jane Smith" into { firstName, lastName }. If the
 * caller already provided split fields, honor those.
 *
 * Boldtrail accepts whatever we send; we send both first + last so the
 * agent sees the lead's name formatted correctly in the CRM. When all
 * we have is one field (the Contact form just collects "Name"), we
 * split on the last whitespace so multi-word first names ("Jean
 * Pierre Dubois" → first "Jean Pierre", last "Dubois") aren't mangled.
 */
function splitName(lead: BoldtrailLead): { firstName: string; lastName: string } {
  if (lead.firstName || lead.lastName) {
    return { firstName: lead.firstName ?? "", lastName: lead.lastName ?? "" };
  }
  return { firstName: "", lastName: "" };
}

/**
 * Manual test — fired from the admin "Send Test Lead" button on the
 * Boldtrail integration page. Returns the same result shape as the
 * real send so the UI can display it directly.
 */
export async function sendBoldtrailTest(): Promise<BoldtrailResult> {
  return sendBoldtrailLead({
    source: "wiring-test",
    firstName: "Boldtrail",
    lastName: "Test",
    email: "boldtrail-test-noreply@example.com",
    phone: "7035550101",
    message:
      "Automated wiring test from the admin panel. Safe to delete — no real visitor submitted this.",
  });
}

/**
 * Public helper used by form server actions. Wraps sendBoldtrailLead
 * so callers can fire-and-forget without the per-form data-shape
 * conversion. Pulls firstName/lastName out of a single "name" field
 * if that's what the form collected.
 */
export function deriveLeadFromForm(input: {
  source: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  data?: Record<string, unknown>;
}): BoldtrailLead {
  const firstName = stringField(input.data, "first_name") ?? stringField(input.data, "firstName");
  const lastName = stringField(input.data, "last_name") ?? stringField(input.data, "lastName");

  let derivedFirst = firstName ?? "";
  let derivedLast = lastName ?? "";

  // If we only have a single "name" field (as in the Contact form),
  // split it on the LAST whitespace so multi-word first names survive.
  const fullName = (input.name ?? "").trim();
  if (!derivedFirst && !derivedLast && fullName) {
    const idx = fullName.lastIndexOf(" ");
    if (idx === -1) {
      derivedFirst = fullName;
    } else {
      derivedFirst = fullName.slice(0, idx);
      derivedLast = fullName.slice(idx + 1);
    }
  }

  // Address can live on a few different field names depending on which
  // form generated the lead. Valuation form uses `address`. Custom forms
  // might use `street_address` or similar.
  const address =
    stringField(input.data, "address") ??
    stringField(input.data, "property_address") ??
    stringField(input.data, "propertyAddress") ??
    stringField(input.data, "street_address") ??
    undefined;

  return {
    source: input.source,
    firstName: derivedFirst || undefined,
    lastName: derivedLast || undefined,
    email: input.email ?? undefined,
    phone: input.phone ?? undefined,
    message: input.message ?? undefined,
    address,
  };
}

function stringField(
  data: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const v = data?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}
