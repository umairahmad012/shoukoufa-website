"use client";

/**
 * PageMetaEditor — accordion of per-page SEO forms.
 *
 * Each item shows:
 *   • Title input  — placeholder = fallback (so admins SEE what
 *     leaving it blank produces, without having to save first).
 *   • Description textarea — same placeholder treatment.
 *   • A "View live" link out to the public page.
 *   • A character counter on each field (Google truncates titles
 *     ~60 chars, descriptions ~160 chars — we color the counter
 *     amber once it goes over).
 *
 * Saving an empty title + empty description deletes the row, so the
 * fallback generator takes over. (Saving an empty title alone with a
 * description stores empty string — the fallback title still fires
 * because `buildPageMetadata` treats empty as falsy.)
 */

import { useState, useTransition } from "react";
import { ExternalLink, Check } from "lucide-react";
import { updatePageMeta } from "@/app/admin/settings/actions";
import { AiLoader } from "@/components/ui/ai-loader";

type Item = {
  key: string;
  label: string;
  href: string;
  currentTitle: string;
  currentDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

export default function PageMetaEditor({ items }: { items: Item[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <PageRow key={item.key} item={item} />
      ))}
    </div>
  );
}

function PageRow({ item }: { item: Item }) {
  const [title, setTitle] = useState(item.currentTitle);
  const [description, setDescription] = useState(item.currentDescription);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Dirty" = different from what's in the DB. Drives the Save button.
  const dirty =
    title !== item.currentTitle || description !== item.currentDescription;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updatePageMeta({
        page_key: item.key,
        title,
        description,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      // Update the "current*" reference so dirty-detection resets.
      // Reload-free; admin sees the change immediately.
      item.currentTitle = title;
      item.currentDescription = description;
      // Hide the saved indicator after a few seconds.
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function resetToFallback() {
    setTitle("");
    setDescription("");
  }

  return (
    <div
      className="admin-card-elevated rounded-xl p-6"
      style={{ color: "var(--card-foreground)" }}
    >
      {/* Header: page label + live link */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.22em] mb-1"
            style={{ color: "var(--muted-foreground)", fontWeight: 700 }}
          >
            {item.key}
          </p>
          <h3
            className="text-base"
            style={{ color: "var(--card-foreground)", fontWeight: 600 }}
          >
            {item.label}
          </h3>
        </div>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5 shrink-0"
          style={{ color: "var(--primary)", fontWeight: 600 }}
        >
          View live <ExternalLink size={11} />
        </a>
      </div>

      {/* Title */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <label
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--muted-foreground)", fontWeight: 600 }}
          >
            SEO Title
          </label>
          <CharCount value={title} limit={TITLE_LIMIT} />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={item.fallbackTitle}
          className="w-full px-3 py-2 rounded-md text-sm"
          style={{
            background: "var(--input)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Description */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-2">
          <label
            className="text-[11px] uppercase tracking-[0.18em]"
            style={{ color: "var(--muted-foreground)", fontWeight: 600 }}
          >
            Meta Description
          </label>
          <CharCount value={description} limit={DESC_LIMIT} />
        </div>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={item.fallbackDescription}
          className="w-full px-3 py-2 rounded-md text-sm leading-relaxed resize-y"
          style={{
            background: "var(--input)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Action row: error + reset + save */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs">
          {error ? (
            <span style={{ color: "var(--destructive)" }}>{error}</span>
          ) : saved ? (
            <span
              className="inline-flex items-center gap-1.5"
              style={{ color: "var(--primary)", fontWeight: 600 }}
            >
              <Check size={13} /> Saved
            </span>
          ) : (
            <span style={{ color: "var(--muted-foreground)" }}>
              Placeholder text = what visitors and Google see when you
              leave the field blank.
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetToFallback}
            disabled={pending || (!title && !description)}
            className="text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-md disabled:opacity-50"
            style={{
              color: "var(--muted-foreground)",
              background: "transparent",
              border: "1px solid var(--border)",
              fontWeight: 600,
            }}
          >
            Use default
          </button>
          {pending ? (
            <AiLoader text="Saving" />
          ) : (
            <button
              type="button"
              onClick={save}
              disabled={!dirty}
              className="text-[11px] uppercase tracking-[0.18em] px-4 py-1.5 rounded-md disabled:opacity-40"
              style={{
                color: "var(--primary-foreground)",
                background: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CharCount({ value, limit }: { value: string; limit: number }) {
  const len = value.length;
  const over = len > limit;
  return (
    <span
      className="text-[10px] tabular-nums"
      style={{
        color: over ? "var(--destructive)" : "var(--muted-foreground)",
        fontWeight: 600,
      }}
    >
      {len}/{limit}
    </span>
  );
}
