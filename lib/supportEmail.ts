/**
 * Support-ticket email rendering + sending.
 *
 * Two emails go out per submission:
 *   1) Brand Bonjour (umair@brandbonjour.com or SUPPORT_RECIPIENT_EMAIL) —
 *      the actual ticket with reply-to set to the submitter so a reply
 *      goes straight back to the realtor's inbox.
 *   2) Submitter — a "we got your request" receipt so they have a paper
 *      trail in their own email.
 *
 * Sender is the same Brand Bonjour Resend domain used for form
 * notifications. If RESEND_API_KEY is unset (dev), we silently no-op so
 * form submission still works end-to-end against the DB.
 */
import { Resend } from "resend";
import type {
  SupportCategoryValue,
  SupportTicket,
  SupportUrgencyValue,
  TicketAttachment,
} from "./supportTickets";
import { categoryLabel, urgencyLabel } from "./supportTickets";

const SUPPORT_RECIPIENT =
  process.env.SUPPORT_RECIPIENT_EMAIL || "umair@brandbonjour.com";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(realtorName: string): string {
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "notifications@brandbonjour.com";
  const displayName = (realtorName?.trim() || "Website").replace(/["<>]/g, "");
  return `${displayName} Support <${fromEmail}>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function urgencyBadge(urgency: SupportUrgencyValue): string {
  const colors: Record<SupportUrgencyValue, string> = {
    low: "#5a7184",
    normal: "#3b6cb0",
    urgent: "#b03a3a",
  };
  return `<span style="display:inline-block;padding:3px 9px;border-radius:4px;background:${colors[urgency]};color:#fff;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(urgency)}</span>`;
}

function renderAttachments(items: TicketAttachment[]): string {
  if (!items || items.length === 0) return "";
  const list = items
    .map((a) => {
      const label = escapeHtml(a.name || a.alt || a.url || "attachment");
      if (a.url) {
        return `<li><a href="${escapeHtml(a.url)}" style="color:#3b6cb0;">${label}</a></li>`;
      }
      return `<li>${label}</li>`;
    })
    .join("");
  return `<p style="margin:18px 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5a7184;">Attachments</p><ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;">${list}</ul>`;
}

/** Build the email body sent to Brand Bonjour (Umair). */
export function renderTicketEmailHtml(input: {
  ticket: SupportTicket;
  realtorName: string;
  siteOrigin: string;
}): string {
  const { ticket, realtorName, siteOrigin } = input;
  const adminUrl = `${siteOrigin}/admin/support/tickets/${ticket.id}`;
  return `
<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a2238;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
  <tr><td style="padding:24px 32px 16px;border-bottom:1px solid #ebe7df;">
    <p style="margin:0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#5a7184;">Support Request — ${escapeHtml(ticket.ticket_number)}</p>
    <h1 style="margin:6px 0 0;font-size:20px;font-weight:600;color:#1a2238;">${escapeHtml(realtorName)} &middot; ${escapeHtml(categoryLabel(ticket.category))}</h1>
  </td></tr>
  <tr><td style="padding:24px 32px;font-size:14px;line-height:1.7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;width:120px;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Urgency</td><td style="padding:6px 0;">${urgencyBadge(ticket.urgency)} <span style="color:#5a7184;font-size:13px;">&nbsp;${escapeHtml(urgencyLabel(ticket.urgency))}</span></td></tr>
      ${ticket.affected_page ? `<tr><td style="padding:6px 0;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Page</td><td style="padding:6px 0;">${escapeHtml(ticket.affected_page)}</td></tr>` : ""}
      <tr><td style="padding:6px 0;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Submitted by</td><td style="padding:6px 0;">${escapeHtml(ticket.submitter_name || "—")} &lt;${escapeHtml(ticket.submitter_email)}&gt;</td></tr>
    </table>
    <p style="margin:18px 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5a7184;">What they need</p>
    <div style="margin:0;padding:14px 16px;background:#f5f3ef;border-left:3px solid #c9a961;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(ticket.description)}</div>
    ${renderAttachments(ticket.attachments || [])}
    <p style="margin:28px 0 0;font-size:13px;">
      <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 20px;background:#1a2238;color:#fff;text-decoration:none;border-radius:4px;letter-spacing:0.12em;text-transform:uppercase;font-size:11px;">View ticket in admin</a>
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#8893a3;">Reply to this email goes directly to the realtor (${escapeHtml(ticket.submitter_email)}).</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Plain-text fallback for the same notification. */
export function renderTicketEmailText(input: {
  ticket: SupportTicket;
  realtorName: string;
  siteOrigin: string;
}): string {
  const { ticket, realtorName, siteOrigin } = input;
  const lines: string[] = [
    `Support Request — ${ticket.ticket_number}`,
    `Realtor: ${realtorName}`,
    `Category: ${categoryLabel(ticket.category)}`,
    `Urgency: ${ticket.urgency} (${urgencyLabel(ticket.urgency)})`,
  ];
  if (ticket.affected_page) lines.push(`Page: ${ticket.affected_page}`);
  lines.push(
    `Submitted by: ${ticket.submitter_name || "—"} <${ticket.submitter_email}>`,
    "",
    "What they need:",
    ticket.description,
    "",
  );
  if (ticket.attachments?.length) {
    lines.push("Attachments:");
    for (const a of ticket.attachments) {
      lines.push(`  • ${a.name || a.alt || a.url || "(no url)"}${a.url ? ` — ${a.url}` : ""}`);
    }
    lines.push("");
  }
  lines.push(`View in admin: ${siteOrigin}/admin/support/tickets/${ticket.id}`);
  return lines.join("\n");
}

/** Receipt email sent to the submitter. */
export function renderReceiptEmailHtml(input: {
  ticket: SupportTicket;
  realtorName: string;
}): string {
  const { ticket, realtorName } = input;
  return `
<!doctype html>
<html><body style="margin:0;padding:0;background:#f5f3ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a2238;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
  <tr><td style="padding:28px 32px;border-bottom:1px solid #ebe7df;">
    <p style="margin:0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#5a7184;">Receipt — ${escapeHtml(ticket.ticket_number)}</p>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:500;color:#1a2238;">We received your request.</h1>
  </td></tr>
  <tr><td style="padding:24px 32px;font-size:14px;line-height:1.75;color:#3a4255;">
    <p style="margin:0 0 16px;">Hi ${escapeHtml(ticket.submitter_name || "there")} — this is a copy of the support request you just sent. Brand Bonjour will reply to <strong>${escapeHtml(ticket.submitter_email)}</strong> as soon as they have an update.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 0;">
      <tr><td style="padding:5px 0;width:120px;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Category</td><td style="padding:5px 0;">${escapeHtml(categoryLabel(ticket.category))}</td></tr>
      <tr><td style="padding:5px 0;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Urgency</td><td style="padding:5px 0;">${urgencyBadge(ticket.urgency)}</td></tr>
      ${ticket.affected_page ? `<tr><td style="padding:5px 0;color:#5a7184;text-transform:uppercase;font-size:11px;letter-spacing:0.16em;">Page</td><td style="padding:5px 0;">${escapeHtml(ticket.affected_page)}</td></tr>` : ""}
    </table>
    <p style="margin:18px 0 6px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#5a7184;">Your message</p>
    <div style="margin:0;padding:14px 16px;background:#f5f3ef;border-left:3px solid #c9a961;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(ticket.description)}</div>
    <p style="margin:24px 0 0;font-size:12px;color:#8893a3;">You can track this ticket inside ${escapeHtml(realtorName)}&apos;s admin panel under Support.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Send both emails for a freshly-created ticket. */
export async function sendTicketEmails(input: {
  ticket: SupportTicket;
  realtorName: string;
  siteOrigin: string;
}): Promise<{ ok: boolean; error?: string; recipientId?: string | null; receiptId?: string | null }> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  const { ticket, realtorName, siteOrigin } = input;
  const subject = `[${ticket.ticket_number}] ${realtorName} — ${categoryLabel(ticket.category)} (${ticket.urgency})`;
  const html = renderTicketEmailHtml({ ticket, realtorName, siteOrigin });
  const text = renderTicketEmailText({ ticket, realtorName, siteOrigin });

  let recipientId: string | null = null;
  let receiptId: string | null = null;

  try {
    const main = await resend.emails.send({
      from: fromAddress(realtorName),
      to: [SUPPORT_RECIPIENT],
      replyTo: ticket.submitter_email,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Source": "support-ticket",
        "X-Ticket-Number": ticket.ticket_number,
      },
    });
    recipientId = main.data?.id ?? null;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Receipt copy to submitter. Failure here doesn't fail the whole submission.
  try {
    const receipt = await resend.emails.send({
      from: fromAddress(realtorName),
      to: [ticket.submitter_email],
      subject: `[${ticket.ticket_number}] We received your support request`,
      html: renderReceiptEmailHtml({ ticket, realtorName }),
      text: `We received your support request (${ticket.ticket_number}). Brand Bonjour will reply to ${ticket.submitter_email} as soon as they have an update.\n\nYour message:\n${ticket.description}`,
      headers: {
        "X-Entity-Source": "support-ticket-receipt",
        "X-Ticket-Number": ticket.ticket_number,
      },
    });
    receiptId = receipt.data?.id ?? null;
  } catch (e) {
    console.error("receipt email failed:", e);
  }

  return { ok: true, recipientId, receiptId };
}
