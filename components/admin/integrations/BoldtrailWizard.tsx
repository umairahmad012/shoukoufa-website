"use client";

/**
 * Boldtrail integration wizard — single page, save + test.
 *
 * Shows the masked stored key (so admins can confirm one IS saved
 * without exposing it), a paste field, an optional source-label
 * override, and a Test button that fires a fake lead at Boldtrail
 * and surfaces the result inline.
 */

import { useState, useTransition } from "react";
import { Check, KeyRound, AlertTriangle, ExternalLink } from "lucide-react";
import {
  saveBoldtrailIntegration,
  disconnectBoldtrail,
  enableBoldtrail,
  testBoldtrailIntegration,
} from "@/app/admin/integrations/boldtrail/actions";
import { AiLoader } from "@/components/ui/ai-loader";

type Existing =
  | {
      maskedKey: string;
      sourceLabel: string;
      enabled: boolean;
    }
  | null;

type TestState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "success"; leadId: number | null }
  | { kind: "error"; message: string; status?: number };

export default function BoldtrailWizard({ existing }: { existing: Existing }) {
  const [apiKey, setApiKey] = useState("");
  const [sourceLabel, setSourceLabel] = useState(existing?.sourceLabel ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<TestState>({ kind: "idle" });

  const hasExisting = existing !== null;
  const enabled = existing?.enabled ?? false;

  function save() {
    setError(null);
    setSaved(false);
    setTest({ kind: "idle" });
    startTransition(async () => {
      const res = await saveBoldtrailIntegration({ apiKey, sourceLabel });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setApiKey("");
      // Force a soft refresh so the masked key updates.
      setTimeout(() => window.location.reload(), 600);
    });
  }

  function runTest() {
    setTest({ kind: "running" });
    startTransition(async () => {
      const res = await testBoldtrailIntegration();
      if (res.ok) {
        setTest({ kind: "success", leadId: res.id });
      } else {
        setTest({ kind: "error", message: res.error, status: res.status });
      }
    });
  }

  function toggleEnabled() {
    startTransition(async () => {
      const res = enabled
        ? await disconnectBoldtrail()
        : await enableBoldtrail();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      {/* — Where to find the key — */}
      <div
        className="admin-card-elevated rounded-xl p-6"
        style={{ color: "var(--card-foreground)" }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.22em] mb-2"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}
        >
          Step 1 — Get the key from Boldtrail
        </p>
        <ol
          className="text-sm leading-relaxed list-decimal pl-4 space-y-1"
          style={{ color: "var(--foreground)" }}
        >
          <li>
            Log in to{" "}
            <a
              href="https://app.kvcore.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--primary)", fontWeight: 600 }}
              className="inline-flex items-center gap-1"
            >
              Boldtrail <ExternalLink size={11} />
            </a>
          </li>
          <li>Open <strong>Settings → Integrations → Lead Capture API</strong></li>
          <li>Click <strong>Generate New Token</strong> (or copy an existing one)</li>
          <li>Paste it below and Save</li>
        </ol>
      </div>

      {/* — Existing connection — */}
      {hasExisting && (
        <div
          className="admin-card-elevated rounded-xl p-6 flex items-center justify-between gap-4"
          style={{ color: "var(--card-foreground)" }}
        >
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.22em] mb-1"
              style={{
                color: enabled ? "var(--primary)" : "var(--muted-foreground)",
                fontWeight: 700,
              }}
            >
              {enabled ? "Connected · Live" : "Connected · Disabled"}
            </p>
            <p
              className="text-sm admin-mono"
              style={{ color: "var(--foreground)" }}
            >
              Key: {existing!.maskedKey}
            </p>
            {existing!.sourceLabel ? (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                Source label: <strong>{existing!.sourceLabel}</strong>
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={toggleEnabled}
            disabled={pending}
            className="text-[11px] uppercase tracking-[0.18em] px-4 py-2 rounded-md disabled:opacity-50"
            style={{
              color: enabled ? "var(--destructive)" : "var(--primary)",
              background: "transparent",
              border: `1px solid ${enabled ? "var(--destructive)" : "var(--primary)"}`,
              fontWeight: 700,
            }}
          >
            {enabled ? "Disable" : "Re-enable"}
          </button>
        </div>
      )}

      {/* — Paste form — */}
      <div
        className="admin-card-elevated rounded-xl p-6"
        style={{ color: "var(--card-foreground)" }}
      >
        <p
          className="text-[10px] uppercase tracking-[0.22em] mb-4"
          style={{ color: "var(--muted-foreground)", fontWeight: 700 }}
        >
          {hasExisting ? "Replace the saved key" : "Paste the API key"}
        </p>

        <div className="mb-5">
          <label className="admin-label">Boldtrail Lead Capture API Key</label>
          <textarea
            rows={3}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOi…"
            className="admin-input admin-mono text-xs leading-relaxed"
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="mb-5">
          <label className="admin-label">
            Source Label <span style={{ color: "var(--muted-foreground)" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="shoukoufahomes.com"
            className="admin-input"
          />
          <p
            className="text-[11px] mt-1.5 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Shows up in Boldtrail next to each lead so the agent can tell which
            site sent it. We prepend this to the form name automatically — e.g.{" "}
            <code className="admin-mono">{(sourceLabel || "shoukoufahomes.com")} · contact</code>.
          </p>
        </div>

        {error ? (
          <div
            className="flex items-start gap-2 text-sm mb-4 p-3 rounded-md"
            style={{
              color: "var(--destructive)",
              background:
                "color-mix(in srgb, var(--destructive) 8%, transparent)",
            }}
          >
            <AlertTriangle size={14} className="mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {saved ? (
          <div
            className="flex items-start gap-2 text-sm mb-4 p-3 rounded-md"
            style={{
              color: "var(--primary)",
              background:
                "color-mix(in srgb, var(--primary) 8%, transparent)",
            }}
          >
            <Check size={14} className="mt-0.5" />
            <span>Saved. Reloading…</span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {pending && !test.kind ? (
            <AiLoader text="Saving" />
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={pending || !apiKey.trim()}
              className="text-[11px] uppercase tracking-[0.18em] px-5 py-2 rounded-md disabled:opacity-40"
              style={{
                color: "var(--primary-foreground)",
                background: "var(--primary)",
                fontWeight: 700,
              }}
            >
              <KeyRound size={12} className="inline mr-2" />
              {hasExisting ? "Replace key" : "Save & connect"}
            </button>
          )}
        </div>
      </div>

      {/* — Test connection — */}
      {hasExisting && enabled && (
        <div
          className="admin-card-elevated rounded-xl p-6"
          style={{ color: "var(--card-foreground)" }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.22em] mb-2"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}
          >
            Step 2 — Verify
          </p>
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: "var(--foreground)" }}
          >
            Fires a fake lead (name &ldquo;Boldtrail Test&rdquo;) at Boldtrail
            using the saved key. If it succeeds, you&rsquo;ll see the new lead
            in your Boldtrail inbox within seconds.
          </p>

          {test.kind === "success" ? (
            <div
              className="flex items-start gap-2 text-sm p-3 rounded-md mb-4"
              style={{
                color: "var(--primary)",
                background:
                  "color-mix(in srgb, var(--primary) 8%, transparent)",
              }}
            >
              <Check size={14} className="mt-0.5" />
              <span>
                Test lead pushed{test.leadId ? ` (Boldtrail id: ${test.leadId})` : ""}.
                Check your Boldtrail inbox — and delete the test lead when
                you&rsquo;ve confirmed.
              </span>
            </div>
          ) : null}

          {test.kind === "error" ? (
            <div
              className="flex items-start gap-2 text-sm p-3 rounded-md mb-4"
              style={{
                color: "var(--destructive)",
                background:
                  "color-mix(in srgb, var(--destructive) 8%, transparent)",
              }}
            >
              <AlertTriangle size={14} className="mt-0.5" />
              <span>
                <strong>
                  {test.status ? `HTTP ${test.status}: ` : ""}
                  Test failed.
                </strong>{" "}
                {test.message}
              </span>
            </div>
          ) : null}

          {test.kind === "running" ? (
            <AiLoader text="Pinging Boldtrail" />
          ) : (
            <button
              type="button"
              onClick={runTest}
              disabled={pending}
              className="text-[11px] uppercase tracking-[0.18em] px-5 py-2 rounded-md disabled:opacity-40"
              style={{
                color: "var(--primary-foreground)",
                background: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Send test lead
            </button>
          )}
        </div>
      )}
    </div>
  );
}
