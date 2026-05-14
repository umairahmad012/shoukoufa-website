"use client";

/**
 * Page Builder — the interactive admin UI for arranging blocks on a page.
 *
 * Features:
 *   • Page picker dropdown (jump between home / about / buyers / etc.)
 *   • Block list with up/down reorder, on-off toggle, edit / duplicate / delete
 *   • "Add Block" modal — block library grouped by category
 *   • "Edit Block" modal — auto-rendered form from blockRegistry.dataShape,
 *     plus a universal wrapper sub-form (background image, YouTube video,
 *     overlay, spacing, theme)
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Settings2,
  ExternalLink,
} from "lucide-react";
import {
  addBlock,
  deleteBlock,
  duplicateBlock,
  reorderBlocks,
  toggleBlock,
  updateBlockData,
} from "@/app/admin/builder/[page]/actions";
import {
  BLOCK_DEFS,
  blockDefsByCategory,
  findBlockDef,
  wrapperShape,
  type BlockWrapper,
} from "@/lib/blockRegistry";
import { FieldRenderer, MediaLibraryProvider } from "@/components/admin/content/Fields";
import type { PageBlockRow } from "@/lib/pageBlocks";
import type { VideoLibraryItem } from "@/components/admin/media/VideoPicker";

type PageMeta = { key: string; label: string; livePath: string };

export default function BuilderClient({
  pageKey,
  pageLabel,
  livePath,
  pages,
  initialBlocks,
  library,
}: {
  pageKey: string;
  pageLabel: string;
  livePath: string;
  pages: PageMeta[];
  initialBlocks: PageBlockRow[];
  library: VideoLibraryItem[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<PageBlockRow[]>(initialBlocks);
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editingBlock = blocks.find((b) => b.id === editingId);

  function refresh() {
    router.refresh();
  }

  function handleAdd(blockType: string) {
    startTransition(async () => {
      const res = await addBlock({ pageKey, blockType });
      if (res.ok) {
        setShowPicker(false);
        refresh();
      } else {
        alert(`Add failed: ${res.error}`);
      }
    });
  }

  function handleToggle(id: string, enabled: boolean) {
    setBlocks((b) =>
      b.map((row) => (row.id === id ? { ...row, enabled } : row)),
    );
    startTransition(async () => {
      await toggleBlock({ id, enabled, pageKey });
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this block? This can't be undone.")) return;
    setBlocks((b) => b.filter((row) => row.id !== id));
    startTransition(async () => {
      const res = await deleteBlock({ id, pageKey });
      if (!res.ok) {
        alert(`Delete failed: ${res.error}`);
        refresh();
      }
    });
  }

  function handleDuplicate(id: string) {
    startTransition(async () => {
      const res = await duplicateBlock({ id, pageKey });
      if (res.ok) refresh();
      else alert(`Duplicate failed: ${res.error}`);
    });
  }

  function handleMove(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    const [row] = next.splice(idx, 1);
    next.splice(j, 0, row);
    setBlocks(next);
    startTransition(async () => {
      await reorderBlocks({ pageKey, orderedIds: next.map((b) => b.id) });
      refresh();
    });
  }

  function handleSaveEdit(id: string, data: Record<string, unknown>) {
    setBlocks((b) =>
      b.map((row) => (row.id === id ? { ...row, data } : row)),
    );
    startTransition(async () => {
      const res = await updateBlockData({ id, data, pageKey });
      if (res.ok) {
        setEditingId(null);
        refresh();
      } else {
        alert(`Save failed: ${res.error}`);
      }
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p
            className="text-[0.65rem] tracking-[0.32em] uppercase text-ink/55 mb-3"
            style={{ fontWeight: 500 }}
          >
            Page Builder
          </p>
          <h1
            className="text-2xl md:text-3xl text-ink mb-2"
            style={{ fontWeight: 600 }}
          >
            {pageLabel}
          </h1>
          <p className="text-sm text-ink/65">
            Add, reorder, toggle, edit, or remove sections on this page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={pageKey}
            onChange={(e) => router.push(`/admin/builder/${e.target.value}`)}
            className="admin-input"
            style={{ minWidth: 200 }}
          >
            {pages.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <a
            href={livePath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-ink/70 hover:text-ink px-3 py-2 border border-ink/15 rounded"
          >
            <ExternalLink size={14} /> Live
          </a>
        </div>
      </div>

      {/* Block list */}
      <div className="admin-card divide-y divide-ink/10">
        {blocks.length === 0 && (
          <div className="px-6 py-12 text-center text-ink/60">
            <p className="text-sm">
              No blocks yet. Click "Add Block" below to start building this page.
            </p>
          </div>
        )}
        {blocks.map((block, i) => {
          const def = findBlockDef(block.block_type);
          const preview = blockPreview(block);
          return (
            <div
              key={block.id}
              className={`px-5 py-4 flex items-center gap-4 ${
                block.enabled ? "" : "opacity-50"
              }`}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMove(block.id, -1)}
                  disabled={i === 0 || pending}
                  className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(block.id, 1)}
                  disabled={i === blocks.length - 1 || pending}
                  className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              {/* Type label + preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[0.62rem] tracking-[0.28em] uppercase px-2 py-0.5 rounded bg-ink/8 text-ink/70"
                    style={{ fontWeight: 500 }}
                  >
                    {def?.label ?? block.block_type}
                  </span>
                  {!block.enabled && (
                    <span className="text-[0.62rem] tracking-[0.18em] uppercase text-amber-700">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink/85 truncate">{preview}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggle(block.id, !block.enabled)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-ink/5"
                  title={block.enabled ? "Hide" : "Show"}
                >
                  {block.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  onClick={() => setEditingId(block.id)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-ink/5"
                  title="Edit content"
                >
                  <Settings2 size={16} />
                </button>
                <button
                  onClick={() => handleDuplicate(block.id)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-ink/5"
                  title="Duplicate"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDelete(block.id)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-red-50 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add block */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => setShowPicker(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90"
          style={{ fontWeight: 500 }}
        >
          <Plus size={14} /> Add Block
        </button>
      </div>

      {/* Add Block Modal */}
      {showPicker && (
        <BlockPicker
          onPick={handleAdd}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <BlockEditor
          block={editingBlock}
          library={library}
          onSave={handleSaveEdit}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------- HELPER

function blockPreview(b: PageBlockRow): string {
  const d = b.data as Record<string, unknown>;
  // Try to surface a meaningful one-line preview based on common fields
  if (typeof d.heading === "string" && d.heading.trim()) return d.heading;
  if (Array.isArray(d.titleLines) && d.titleLines.length > 0) {
    const lines = d.titleLines.filter((s) => typeof s === "string");
    if (lines.length > 0) return lines.join(" / ");
  }
  if (typeof d.eyebrow === "string" && d.eyebrow.trim()) return d.eyebrow;
  if (typeof d.text === "string" && d.text.trim()) return d.text;
  if (typeof d.quote === "string" && d.quote.trim()) return `"${d.quote}"`;
  return `(no preview)`;
}

// ---------------------------------------------------------------------- PICKER

function BlockPicker({
  onPick,
  onClose,
}: {
  onPick: (type: string) => void;
  onClose: () => void;
}) {
  const groups = blockDefsByCategory();
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink/10">
          <h2
            className="text-lg text-ink"
            style={{ fontWeight: 600 }}
          >
            Add a Block
          </h2>
          <p className="text-sm text-ink/65 mt-1">
            Pick a section type to add to this page. You can edit and reorder
            it after.
          </p>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-7">
          {Object.entries(groups).map(([cat, defs]) => (
            <div key={cat}>
              <p
                className="text-[0.62rem] tracking-[0.3em] uppercase text-ink/55 mb-3"
                style={{ fontWeight: 600 }}
              >
                {cat}
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {defs.map((d) => (
                  <button
                    key={d.type}
                    onClick={() => onPick(d.type)}
                    className="text-left p-4 border border-ink/15 rounded hover:border-navy hover:bg-cream-soft transition-colors"
                  >
                    <p className="text-sm text-ink mb-1" style={{ fontWeight: 500 }}>
                      {d.label}
                    </p>
                    <p className="text-xs text-ink/65 leading-relaxed">
                      {d.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-ink/10 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm text-ink/70 hover:text-ink px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------- EDITOR

function BlockEditor({
  block,
  library,
  onSave,
  onClose,
}: {
  block: PageBlockRow;
  library: VideoLibraryItem[];
  onSave: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const def = findBlockDef(block.block_type);
  const [data, setData] = useState<Record<string, unknown>>({ ...block.data });
  const wrapper = (data.wrapper as BlockWrapper | undefined) ?? {};

  function setField(key: string, value: unknown) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function setWrapperField(key: keyof BlockWrapper, value: unknown) {
    setData((d) => ({
      ...d,
      wrapper: { ...(d.wrapper as Record<string, unknown>), [key]: value },
    }));
  }

  if (!def) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded max-w-sm">
          <p className="text-sm">Unknown block type: {block.block_type}</p>
          <button onClick={onClose} className="mt-3 text-sm">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink/10 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[0.62rem] tracking-[0.28em] uppercase text-ink/55 mb-2"
              style={{ fontWeight: 500 }}
            >
              {def.label}
            </p>
            <h2 className="text-lg text-ink" style={{ fontWeight: 600 }}>
              Edit Block
            </h2>
            <p className="text-sm text-ink/65 mt-1">{def.description}</p>
          </div>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto space-y-8">
          {/* Block-specific fields */}
          <MediaLibraryProvider library={library as VideoLibraryItem[]}>
            <div className="space-y-6">
              {Object.entries(def.dataShape).map(([key, field]) => {
                const colorKey = `${key}Color`;
                const colorable =
                  (field.type === "text" || field.type === "paragraph") &&
                  field.colorable === true;
                return (
                  <FieldRenderer
                    key={key}
                    field={field}
                    value={data[key]}
                    onChange={(next) => setField(key, next)}
                    colorValue={colorable ? (data[colorKey] as string | undefined) : undefined}
                    onColorChange={
                      colorable ? (next) => setField(colorKey, next) : undefined
                    }
                  />
                );
              })}
            </div>

            {/* Universal wrapper fields */}
            <details className="border-t border-ink/10 pt-6" open>
              <summary
                className="cursor-pointer text-[0.62rem] tracking-[0.3em] uppercase text-ink/55 mb-4"
                style={{ fontWeight: 600 }}
              >
                Section Background & Style
              </summary>
              <div className="space-y-5 mt-4">
                {Object.entries(wrapperShape).map(([key, field]) => (
                  <FieldRenderer
                    key={key}
                    field={field}
                    value={(wrapper as Record<string, unknown>)[key]}
                    onChange={(next) =>
                      setWrapperField(key as keyof BlockWrapper, next)
                    }
                  />
                ))}
              </div>
            </details>
          </MediaLibraryProvider>
        </div>
        <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-ink/70 hover:text-ink px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(block.id, data)}
            className="px-6 py-2 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90"
            style={{ fontWeight: 500 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
