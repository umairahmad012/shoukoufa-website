/**
 * Email notifications for form submissions.
 *
 * Sender is Brand Bonjour's verified Resend domain. The realtor doesn't
 * touch DNS — they just type their inbox address into Admin → Settings
 * → Notifications, and emails arrive from "<Realtor Name> Website
 * <notifications@brandbonjour.com>" with their reply-to set to the
 * submitter so they can answer the lead directly.
 *
 * All env vars are optional. If RESEND_API_KEY isn't set we silently
 * no-op so dev environments don't crash on form submissions. Missing
 * settings (no recipient configured) also no-op.
 *
 * Env vars (set in Netlify):
 *   RESEND_API_KEY            — from resend.com → API Keys
 *   RESEND_FROM_EMAIL         — verified sender, e.g. notifications@brandbonjour.com
 *   RESEND_FROM_NAME_FALLBACK — optional display name when realtor name unset
 */
import { Resend } from "resend";
import { getSiteSettings, type SiteSettings } from "./siteSettings";

/** Form-source labels used by submitFormPublic / submitBuiltInForm. */
export type LeadSource =
  | "contact"
  | "valuation"
  | "leave-review"
  | "leave-review-internal"
  | string; // custom form slug or open-house-<slug>

export type LeadInput = {
  source: LeadSource;
  formTitle?: string | null;
  /** Raw submission payload (everything from the form). */
  data: Record<string, unknown>;
  /** Extracted common fields (already pulled by submitFormPublic). */
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
};

type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string; reason: "no-api-key" | "no-recipient" | "muted" | "send-failed" };

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(realtorName: string): string {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "notifications@brandbonjour.com";
  const displayName =
    realtorName?.trim() ||
    process.env.RESEND_FROM_NAME_FALLBACK ||
    "Website";
  // Strip anything that would break the address format
  const safeName = displayName.replace(/["<>]/g, "");
  return `${safeName} Website <${fromEmail}>`;
}

/**
 * Check whether a particular source is enabled in the admin's
 * notification preferences. Open-house RSVP forms have slugs that
 * start with "open-house-"; custom forms have arbitrary slugs.
 */
function isSourceEnabled(source: LeadSource, settings: SiteSettings): boolean {
  if (source === "contact") return settings.notifyContact;
  if (source === "valuation") return settings.notifyValuation;
  if (source.startsWith("open-house-")) return settings.notifyRsvp;
  // Treat leave-review + leave-review-internal as "forms" too
  return settings.notifyForms;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSubject(realtorName: string, source: LeadSource, lead: LeadInput): string {
  const sourceLabel =
    source === "contact"
      ? "Contact form"
      : source === "valuation"
        ? "Valuation request"
        : source === "leave-review"
          ? "Public review"
          : source === "leave-review-internal"
            ? "Internal feedback"
            : source.startsWith("open-house-")
              ? "Open house RSVP"
              : lead.formTitle || "Form";
  const who = lead.name?.trim() || lead.email?.trim() || "Anonymous";
  const name = realtorName?.trim() || "your site";
  return `New ${sourceLabel} — ${who} → ${name}`;
}

function buildHtml({
  settings,
  source,
  lead,
  origin,
}: {
  settings: SiteSettings;
  source: LeadSource;
  lead: LeadInput;
  origin: string;
}): string {
  // Render every payload field as a row; common fields stay first.
  const commonOrder = ["name", "email", "phone", "message"];
  const seen = new Set<string>();
  const rows: { label: string; value: string }[] = [];

  for (const key of commonOrder) {
    const raw = lead.data[key] ?? (lead as Record<string, unknown>)[key];
    if (raw != null && raw !== "") {
      rows.push({ label: prettyLabel(key), value: String(raw) });
      seen.add(key);
    }
  }
  for (const [key, raw] of Object.entries(lead.data)) {
    if (seen.has(key)) continue;
    if (raw == null || raw === "") continue;
    rows.push({ label: prettyLabel(key), value: String(raw) });
  }

  const sourceLabel = sourceDisplay(source, lead.formTitle ?? null);
  const inboxUrl = `${origin}/admin/inbox`;
  const realtor = settings.name || "your site";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#182433;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7c8896;margin:0 0 8px;">${escapeHtml(realtor)}</p>
    <h1 style="font-size:22px;font-weight:500;margin:0 0 6px;color:#182433;">New ${escapeHtml(sourceLabel)} submission</h1>
    <p style="font-size:14px;color:#5a6573;margin:0 0 24px;line-height:1.5;">
      ${lead.email ? `Reply directly to this email to respond to <strong>${escapeHtml(lead.name || lead.email)}</strong>.` : "A visitor just left a message on your site."}
    </p>

    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e6e3da;border-radius:6px;overflow:hidden;">
      <tbody>
        ${rows
          .map(
            (r) => `
          <tr style="border-bottom:1px solid #f0ede5;">
            <td style="padding:12px 16px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7c8896;width:35%;vertical-align:top;">${escapeHtml(r.label)}</td>
            <td style="padding:12px 16px;font-size:14px;color:#182433;white-space:pre-wrap;word-break:break-word;">${escapeHtml(r.value)}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    <div style="margin-top:24px;">
      <a href="${inboxUrl}" style="display:inline-block;padding:10px 22px;background:#142840;color:#fff;text-decoration:none;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;border-radius:4px;">View in admin</a>
    </div>

    <p style="font-size:11px;color:#a0a4ac;margin:32px 0 0;line-height:1.6;">
      Sent automatically by your website. To stop receiving these, sign in to the admin panel and toggle off Notifications for this form type.
    </p>
  </div>
</body></html>`;
}

function buildText({
  settings,
  source,
  lead,
  origin,
}: {
  settings: SiteSettings;
  source: LeadSource;
  lead: LeadInput;
  origin: string;
}): string {
  const rows = Object.entries(lead.data)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${prettyLabel(k)}: ${String(v)}`)
    .join("\n");
  const sourceLabel = sourceDisplay(source, lead.formTitle ?? null);
  const realtor = settings.name || "your site";
  return [
    `${realtor}`,
    `New ${sourceLabel} submission`,
    "",
    rows,
    "",
    `View in admin: ${origin}/admin/inbox`,
  ].join("\n");
}

function prettyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function sourceDisplay(source: LeadSource, formTitle: string | null): string {
  if (source === "contact") return "Contact form";
  if (source === "valuation") return "Valuation request";
  if (source === "leave-review") return "Public review";
  if (source === "leave-review-internal") return "Internal feedback";
  if (source.startsWith("open-house-")) return "Open house RSVP";
  return formTitle?.trim() || "Form";
}

function originFromEnv(): string {
  // Netlify exposes URL; fall back to localhost during dev
  const url = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (url) return url.startsWith("http") ? url : `https://${url}`;
  return "http://localhost:3009";
}

/**
 * Fire-and-forget notification for a freshly inserted lead. Safe to
 * call from any server action — returns a result for diagnostics but
 * never throws.
 */
export async function sendLeadNotification(input: LeadInput): Promise<SendResult> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set", reason: "no-api-key" };

  const settings = await getSiteSettings();
  if (!settings.notificationEmail?.trim()) {
    return { ok: false, error: "No notification recipient configured", reason: "no-recipient" };
  }
  if (!isSourceEnabled(input.source, settings)) {
    return { ok: false, error: "Source muted by admin", reason: "muted" };
  }

  const origin = originFromEnv();
  const subject = buildSubject(settings.name || "Website", input.source, input);
  const html = buildHtml({ settings, source: input.source, lead: input, origin });
  const text = buildText({ settings, source: input.source, lead: input, origin });

  try {
    const res = await resend.emails.send({
      from: fromAddress(settings.name || "Website"),
      to: [settings.notificationEmail],
      cc: settings.notificationCc?.trim()
        ? [settings.notificationCc]
        : undefined,
      replyTo: input.email?.trim() || settings.email || undefined,
      subject,
      html,
      text,
      // Sender headers help downstream filters identify the source
      headers: {
        "X-Entity-Source": String(input.source),
      },
    });
    return { ok: true, id: res.data?.id ?? null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, reason: "send-failed" };
  }
}

/**
 * Manual test email — fired from the admin "Send Test Email" button.
 * Uses the current saved notification settings so the admin can verify
 * the wiring before the first real submission lands.
 */
export async function sendTestNotification(): Promise<SendResult> {
  return sendLeadNotification({
    source: "contact",
    data: {
      name: "Test Notification",
      email: "test@example.com",
      phone: "(555) 555-0100",
      message:
        "If you're reading this in your inbox, your website notifications are wired up correctly. Real form submissions will arrive here automatically.",
    },
    name: "Test Notification",
    email: "test@example.com",
    phone: "(555) 555-0100",
    message:
      "If you're reading this in your inbox, your website notifications are wired up correctly. Real form submissions will arrive here automatically.",
  });
}
