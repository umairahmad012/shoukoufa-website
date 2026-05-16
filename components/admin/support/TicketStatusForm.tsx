"use client";

/**
 * Inline form on each ticket-detail page. Either side (Brand Bonjour
 * logging in via the same /admin route, or the realtor) can move the
 * ticket through Open → In progress → Replied → Resolved and add
 * resolution notes.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicketStatus } from "@/app/admin/support/actions";
import type { SupportStatusValue } from "@/lib/supportTickets";

export default function TicketStatusForm({
  ticketId,
  currentStatus,
  currentNotes,
  options,
}: {
  ticketId: string;
  currentStatus: SupportStatusValue;
  currentNotes: string;
  options: Array<{ value: SupportStatusValue; label: string }>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SupportStatusValue>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    const res = await updateTicketStatus(ticketId, status, notes);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <select
        className="admin-input"
        value={status}
        onChange={(e) => setStatus(e.target.value as SupportStatusValue)}
        style={{ maxWidth: 280, marginBottom: 12 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label className="admin-label">Resolution notes (optional)</label>
      <textarea
        className="admin-input"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Short note for the realtor — e.g. 'Updated the About paragraph; please refresh.'"
        style={{ width: "100%", fontFamily: "inherit", resize: "vertical", marginBottom: 12 }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="admin-tab"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && (
          <span style={{ color: "#2f6f3e", fontSize: 13 }}>✓ Saved</span>
        )}
        {error && (
          <span style={{ color: "var(--destructive, #b03a3a)", fontSize: 13 }}>{error}</span>
        )}
      </div>
    </div>
  );
}
