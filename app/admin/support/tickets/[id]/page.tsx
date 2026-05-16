import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getSupportTicket,
  categoryLabel,
  urgencyLabel,
  statusLabel,
  SUPPORT_STATUSES,
} from "@/lib/supportTickets";
import TicketStatusForm from "@/components/admin/support/TicketStatusForm";

export const metadata: Metadata = {
  title: "Ticket · Support",
};

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getSupportTicket(id);
  if (!ticket) notFound();

  const created = new Date(ticket.created_at).toLocaleString();
  const updated = new Date(ticket.updated_at).toLocaleString();
  const resolved = ticket.resolved_at
    ? new Date(ticket.resolved_at).toLocaleString()
    : null;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        href="/admin/support/tickets"
        className="admin-tab"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <ArrowLeft size={14} /> All tickets
      </Link>

      <div className="admin-card" style={{ padding: "28px 28px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
          }}
        >
          Ticket {ticket.ticket_number}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "6px 0 16px" }}>
          {categoryLabel(ticket.category)}
        </h1>

        <table style={{ marginBottom: 22, fontSize: 13 }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "4px 14px 4px 0",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  verticalAlign: "top",
                }}
              >
                Urgency
              </td>
              <td style={{ padding: "4px 0" }}>{urgencyLabel(ticket.urgency)}</td>
            </tr>
            {ticket.affected_page && (
              <tr>
                <td
                  style={{
                    padding: "4px 14px 4px 0",
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    verticalAlign: "top",
                  }}
                >
                  Page
                </td>
                <td style={{ padding: "4px 0" }}>{ticket.affected_page}</td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  padding: "4px 14px 4px 0",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  verticalAlign: "top",
                }}
              >
                Submitted by
              </td>
              <td style={{ padding: "4px 0" }}>
                {ticket.submitter_name || "—"} &lt;{ticket.submitter_email}&gt;
              </td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 14px 4px 0",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  verticalAlign: "top",
                }}
              >
                Created
              </td>
              <td style={{ padding: "4px 0" }}>{created}</td>
            </tr>
            <tr>
              <td
                style={{
                  padding: "4px 14px 4px 0",
                  color: "var(--muted-foreground)",
                  textTransform: "uppercase",
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  verticalAlign: "top",
                }}
              >
                Last update
              </td>
              <td style={{ padding: "4px 0" }}>{updated}</td>
            </tr>
            {resolved && (
              <tr>
                <td
                  style={{
                    padding: "4px 14px 4px 0",
                    color: "var(--muted-foreground)",
                    textTransform: "uppercase",
                    fontSize: 11,
                    letterSpacing: "0.16em",
                    verticalAlign: "top",
                  }}
                >
                  Resolved
                </td>
                <td style={{ padding: "4px 0" }}>{resolved}</td>
              </tr>
            )}
          </tbody>
        </table>

        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
          }}
        >
          What was requested
        </p>
        <div
          style={{
            padding: "14px 16px",
            background: "var(--muted)",
            borderLeft: "3px solid var(--brand-gold, #c9a961)",
            borderRadius: 4,
            whiteSpace: "pre-wrap",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {ticket.description}
        </div>

        {ticket.attachments && ticket.attachments.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              Attachments
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {ticket.attachments.map((a, i) => (
                <li
                  key={i}
                  style={{
                    padding: "8px 12px",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    fontSize: 13,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <span style={{ flex: 1 }}>{a.name || a.alt || a.url}</span>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
                      open ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ticket.resolution_notes && (
          <div style={{ marginTop: 22 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--muted-foreground)",
              }}
            >
              Resolution notes
            </p>
            <div
              style={{
                padding: "12px 14px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                whiteSpace: "pre-wrap",
                fontSize: 14,
              }}
            >
              {ticket.resolution_notes}
            </div>
          </div>
        )}

        <hr style={{ margin: "26px 0 18px", border: 0, borderTop: "1px solid var(--border)" }} />

        <p
          style={{
            margin: "0 0 10px",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--muted-foreground)",
          }}
        >
          Update status — current: {statusLabel(ticket.status)}
        </p>
        <TicketStatusForm
          ticketId={ticket.id}
          currentStatus={ticket.status}
          currentNotes={ticket.resolution_notes ?? ""}
          options={SUPPORT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        />
      </div>
    </div>
  );
}
