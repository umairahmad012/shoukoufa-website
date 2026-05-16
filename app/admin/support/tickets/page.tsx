import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { listSupportTickets, categoryLabel, statusLabel } from "@/lib/supportTickets";

export const metadata: Metadata = {
  title: "Support history · Admin",
};

export const dynamic = "force-dynamic";

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    open: { bg: "#fff3cd", fg: "#8a6d3b" },
    in_progress: { bg: "#cce5ff", fg: "#1f4d8a" },
    replied: { bg: "#d1ecf1", fg: "#0c5460" },
    resolved: { bg: "#d4edda", fg: "#2f6f3e" },
  };
  const c = colors[status] || { bg: "#eee", fg: "#444" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 4,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

export default async function SupportTicketsPage() {
  const tickets = await listSupportTickets();
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <Link
        href="/admin"
        className="admin-tab"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18 }}
      >
        <ArrowLeft size={14} /> Back to Site Editor
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 26, fontWeight: 500 }}>Support history</h1>
        <Link
          href="/admin/support"
          className="admin-tab"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          + New request
        </Link>
      </div>
      {tickets.length === 0 ? (
        <div
          className="admin-card"
          style={{ padding: "60px 32px", textAlign: "center", color: "var(--muted-foreground)" }}
        >
          <HelpCircle size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
          <p style={{ marginBottom: 14 }}>
            No support requests yet — submit one anytime from the{" "}
            <Link href="/admin/support" style={{ color: "var(--primary)" }}>
              Support page
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--muted)", textAlign: "left" }}>
                <th style={{ padding: "10px 16px", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Ticket</th>
                <th style={{ padding: "10px 16px", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Category</th>
                <th style={{ padding: "10px 16px", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Created</th>
                <th style={{ padding: "10px 16px", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                >
                  <td colSpan={4} style={{ padding: 0 }}>
                    <Link
                      href={`/admin/support/tickets/${t.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr 160px 130px",
                        padding: "12px 16px",
                        color: "inherit",
                        textDecoration: "none",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontFamily: "var(--font-source-code-pro), monospace", fontWeight: 500 }}>
                        {t.ticket_number}
                      </span>
                      <span>
                        <span style={{ display: "block", fontSize: 14 }}>
                          {categoryLabel(t.category)}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "var(--muted-foreground)",
                            marginTop: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 500,
                          }}
                        >
                          {t.description}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                        {new Date(t.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span>
                        <StatusPill status={t.status} />
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
