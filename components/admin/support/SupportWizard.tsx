"use client";

/**
 * Multi-step "I need help" wizard for the admin panel.
 *
 *   Step 1 — Category (radio cards)
 *   Step 2 — Affected page (optional dropdown / freeform)
 *   Step 3 — Description + urgency
 *   Step 4 — Attachments (optional — uses Cloudinary unsigned upload)
 *   Step 5 — Contact info + review summary + submit
 *
 * State is persisted to localStorage on every change so a navigate-away
 * mid-flow doesn't lose progress. Cleared on successful submit.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitSupportTicket, type SubmitTicketInput } from "@/app/admin/support/actions";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PAGES,
  SUPPORT_URGENCIES,
  type SupportCategoryValue,
  type SupportUrgencyValue,
  type TicketAttachment,
} from "@/lib/supportTickets";

type Draft = {
  step: number;
  category: SupportCategoryValue | "";
  affected_page: string;
  description: string;
  urgency: SupportUrgencyValue;
  attachments: TicketAttachment[];
  submitter_name: string;
  submitter_email: string;
};

const EMPTY: Draft = {
  step: 1,
  category: "",
  affected_page: "",
  description: "",
  urgency: "normal",
  attachments: [],
  submitter_name: "",
  submitter_email: "",
};

const DRAFT_KEY = "admin-support-draft-v1";

function loadDraft(): Draft {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* full quota — ignore */
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

type SubmittedTicket = {
  id: string;
  ticket_number: string;
};

export default function SupportWizard({
  cloudName,
  uploadPreset,
}: {
  cloudName: string;
  uploadPreset: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [submitted, setSubmitted] = useState<SubmittedTicket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount (client-only)
  useEffect(() => {
    const restored = loadDraft();
    setDraft(restored);
  }, []);
  // Persist draft on every change
  useEffect(() => {
    if (submitted) return;
    saveDraft(draft);
  }, [draft, submitted]);

  const set = useCallback(<K extends keyof Draft>(k: K, v: Draft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const canProceed = useMemo(() => {
    if (draft.step === 1) return draft.category !== "";
    if (draft.step === 2) return true; // affected_page is optional
    if (draft.step === 3) return draft.description.trim().length > 4;
    if (draft.step === 4) return true; // attachments optional
    if (draft.step === 5)
      return (
        draft.submitter_name.trim().length > 0 &&
        /.+@.+\..+/.test(draft.submitter_email.trim())
      );
    return false;
  }, [draft]);

  const handleNext = () => {
    setError(null);
    if (!canProceed) return;
    set("step", Math.min(5, draft.step + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleBack = () => {
    setError(null);
    set("step", Math.max(1, draft.step - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      { method: "POST", body: fd },
    );
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const json = (await res.json()) as { secure_url: string; public_id: string };
    return { url: json.secure_url, name: file.name };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const uploads: TicketAttachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const u = await uploadFile(file);
        uploads.push({ url: u.url, name: u.name });
      } catch (e) {
        setError(
          `Couldn't upload ${file.name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    if (uploads.length > 0) {
      set("attachments", [...draft.attachments, ...uploads]);
    }
  };

  const removeAttachment = (idx: number) => {
    set("attachments", draft.attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const input: SubmitTicketInput = {
        category: draft.category as SupportCategoryValue,
        affected_page: draft.affected_page.trim() || null,
        description: draft.description,
        urgency: draft.urgency,
        attachments: draft.attachments,
        submitter_name: draft.submitter_name,
        submitter_email: draft.submitter_email,
      };
      const res = await submitSupportTicket(input);
      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }
      clearDraft();
      setSubmitted({ id: res.data.id, ticket_number: res.data.ticket_number });
      setSubmitting(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSubmitting(false);
    }
  };

  // ─── Submitted confirmation screen ──────────────────────────────────
  if (submitted) {
    return (
      <div className="admin-card" style={{ padding: "40px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 38, marginBottom: 12 }}>✓</div>
        <h2 style={{ fontWeight: 500, fontSize: 22, marginBottom: 8 }}>
          Your request was sent.
        </h2>
        <p style={{ color: "var(--muted-foreground)", marginBottom: 20 }}>
          Ticket <strong>{submitted.ticket_number}</strong> is open. Brand Bonjour
          will reply by email; you can also track status in your support history.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/admin/support/tickets/${submitted.id}`} className="admin-tab" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            View this ticket
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(null);
              setDraft(EMPTY);
            }}
            className="admin-tab"
          >
            Submit another
          </button>
          <Link href="/admin/support/tickets" className="admin-tab">
            All my tickets →
          </Link>
        </div>
      </div>
    );
  }

  // ─── Step progress bar ──────────────────────────────────────────────
  const stepLabels = ["Category", "Page", "Details", "Attachments", "Contact"];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
        {stepLabels.map((label, i) => {
          const idx = i + 1;
          const active = draft.step === idx;
          const done = draft.step > idx;
          return (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "6px 10px",
                borderRadius: 4,
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textAlign: "center",
                background: active
                  ? "var(--primary)"
                  : done
                    ? "var(--brand-gold, #c9a961)"
                    : "var(--muted)",
                color: active || done ? "#fff" : "var(--muted-foreground)",
                fontWeight: 500,
              }}
            >
              {idx}. {label}
            </div>
          );
        })}
      </div>

      <div className="admin-card" style={{ padding: "28px 28px", minHeight: 360 }}>
        {/* ── STEP 1: Category ────────────────────────────────────── */}
        {draft.step === 1 && (
          <div>
            <h2 style={{ fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              What do you need help with?
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 22 }}>
              Pick the closest match — we&rsquo;ll get more specific in a sec.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {SUPPORT_CATEGORIES.map((c) => {
                const active = draft.category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      set("category", c.value);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "14px 14px",
                      borderRadius: 6,
                      border: active
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--border)",
                      background: active ? "var(--accent)" : "var(--card)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "all 0.18s",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: active ? 500 : 400 }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Affected page ───────────────────────────────── */}
        {draft.step === 2 && (
          <div>
            <h2 style={{ fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              Which page does this affect?
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 22 }}>
              Optional — helps us jump straight to the right section. Skip if
              it&rsquo;s site-wide or doesn&rsquo;t apply.
            </p>
            <select
              className="admin-input"
              value={draft.affected_page}
              onChange={(e) => set("affected_page", e.target.value)}
              style={{ marginBottom: 14, maxWidth: 480 }}
            >
              <option value="">— Doesn&apos;t apply / skip —</option>
              {SUPPORT_PAGES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {(draft.affected_page === "__custom__" ||
              (draft.affected_page !== "" &&
                !SUPPORT_PAGES.some((p) => p.value === draft.affected_page))) && (
              <input
                className="admin-input"
                placeholder="e.g. /communities/alexandria"
                value={draft.affected_page === "__custom__" ? "" : draft.affected_page}
                onChange={(e) => set("affected_page", e.target.value)}
                style={{ maxWidth: 480 }}
              />
            )}
          </div>
        )}

        {/* ── STEP 3: Description + urgency ───────────────────────── */}
        {draft.step === 3 && (
          <div>
            <h2 style={{ fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              Tell us what you need.
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 16 }}>
              Be as specific as you can — copy/paste the exact text, link, or
              error message so Brand Bonjour can act on it without follow-up.
            </p>
            <textarea
              className="admin-input"
              rows={8}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="e.g. On the About page, change the second paragraph from &lsquo;…&rsquo; to &lsquo;…&rsquo;"
              style={{ width: "100%", marginBottom: 22, fontFamily: "inherit", resize: "vertical" }}
            />
            <p className="admin-label" style={{ marginBottom: 10 }}>
              How urgent is this?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUPPORT_URGENCIES.map((u) => (
                <label
                  key={u.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: 4,
                    border:
                      draft.urgency === u.value
                        ? "1.5px solid var(--primary)"
                        : "1px solid var(--border)",
                    background:
                      draft.urgency === u.value ? "var(--accent)" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name="urgency"
                    checked={draft.urgency === u.value}
                    onChange={() => set("urgency", u.value)}
                  />
                  <span style={{ fontSize: 14 }}>{u.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Attachments ────────────────────────────────── */}
        {draft.step === 4 && (
          <div>
            <h2 style={{ fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              Any screenshots or files?
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 18 }}>
              Optional. Screenshots of the issue speed up resolution a lot.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="admin-tab"
              style={{ display: "inline-flex", marginBottom: 18 }}
            >
              📎 Choose files…
            </button>
            {draft.attachments.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {draft.attachments.map((a, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 10px",
                      background: "var(--muted)",
                      borderRadius: 4,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ flex: 1 }}>{a.name || a.url}</span>
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)" }}>
                        view ↗
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--destructive)",
                        cursor: "pointer",
                      }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── STEP 5: Contact + review ────────────────────────────── */}
        {draft.step === 5 && (
          <div>
            <h2 style={{ fontWeight: 500, fontSize: 18, marginBottom: 8 }}>
              Where should we reply?
            </h2>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 18 }}>
              We&rsquo;ll reply to this email directly. You&rsquo;ll also get a
              receipt copy here.
            </p>
            <label className="admin-label">Your name</label>
            <input
              className="admin-input"
              value={draft.submitter_name}
              onChange={(e) => set("submitter_name", e.target.value)}
              placeholder="Jane Smith"
              style={{ marginBottom: 12 }}
            />
            <label className="admin-label">Your email</label>
            <input
              className="admin-input"
              type="email"
              value={draft.submitter_email}
              onChange={(e) => set("submitter_email", e.target.value)}
              placeholder="you@example.com"
              style={{ marginBottom: 22 }}
            />
            <div
              style={{
                background: "var(--muted)",
                borderRadius: 6,
                padding: "16px 18px",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--muted-foreground)",
                }}
              >
                Review
              </p>
              <div>
                <strong>Category:</strong>{" "}
                {SUPPORT_CATEGORIES.find((c) => c.value === draft.category)?.label ?? "—"}
              </div>
              {draft.affected_page && (
                <div>
                  <strong>Page:</strong> {draft.affected_page}
                </div>
              )}
              <div>
                <strong>Urgency:</strong>{" "}
                {SUPPORT_URGENCIES.find((u) => u.value === draft.urgency)?.label}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>What you need:</strong>
                <div
                  style={{
                    marginTop: 4,
                    padding: "8px 10px",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {draft.description}
                </div>
              </div>
              {draft.attachments.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Attachments:</strong> {draft.attachments.length} file(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--destructive-foreground, #fee)",
            color: "var(--destructive, #b03a3a)",
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 18,
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          disabled={draft.step === 1 || submitting}
          className="admin-tab"
          style={{ opacity: draft.step === 1 ? 0.45 : 1 }}
        >
          ← Back
        </button>
        {draft.step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className="admin-tab"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              opacity: !canProceed ? 0.45 : 1,
            }}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canProceed || submitting}
            className="admin-tab"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              opacity: !canProceed || submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Sending…" : "Send to support"}
          </button>
        )}
      </div>
    </div>
  );
}
