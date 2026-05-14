"use client";

/**
 * Admin → Pages list + "New Page" modal + per-row settings panel.
 *
 * Each row shows the page's slug, title, status (draft/published),
 * nav toggle, and quick actions: Open Builder, Edit Settings, Delete.
 *
 * "New Page" opens a modal: slug + title + description. On save,
 * jumps straight to the builder for that slug so the admin can start
 * adding blocks.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Eye,
  EyeOff,
  Settings2,
  Trash2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { createPage, updatePage, deletePage } from "@/app/admin/pages/actions";
import type { CustomPage } from "@/lib/customPages";

export default function PagesListClient({
  initialPages,
}: {
  initialPages: CustomPage[];
}) {
  const router = useRouter();
  const [pages, setPages] = useState<CustomPage[]>(initialPages);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleTogglePublished(p: CustomPage) {
    setPages((rows) =>
      rows.map((r) =>
        r.slug === p.slug ? { ...r, published: !r.published } : r,
      ),
    );
    startTransition(async () => {
      const res = await updatePage({ slug: p.slug, published: !p.published });
      if (!res.ok) {
        alert(`Update failed: ${res.error}`);
        refresh();
      }
    });
  }

  function handleToggleNav(p: CustomPage) {
    setPages((rows) =>
      rows.map((r) =>
        r.slug === p.slug ? { ...r, show_in_nav: !r.show_in_nav } : r,
      ),
    );
    startTransition(async () => {
      const res = await updatePage({
        slug: p.slug,
        show_in_nav: !p.show_in_nav,
      });
      if (!res.ok) {
        alert(`Update failed: ${res.error}`);
        refresh();
      }
    });
  }

  function handleDelete(p: CustomPage) {
    if (
      !confirm(
        `Delete "${p.title}" and ALL of its sections? This can't be undone.`,
      )
    )
      return;
    setPages((rows) => rows.filter((r) => r.slug !== p.slug));
    startTransition(async () => {
      const res = await deletePage({ slug: p.slug });
      if (!res.ok) {
        alert(`Delete failed: ${res.error}`);
        refresh();
      }
    });
  }

  const editingPage = pages.find((p) => p.slug === editing);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p
            className="text-[0.65rem] tracking-[0.32em] uppercase text-ink/55 mb-3"
            style={{ fontWeight: 500 }}
          >
            Site Editor · Custom Pages
          </p>
          <h1
            className="text-2xl md:text-3xl text-ink mb-2"
            style={{ fontWeight: 600 }}
          >
            Pages
          </h1>
          <p className="text-sm text-ink/65 max-w-xl">
            Build new pages — landing pages, market reports, neighborhood
            deep-dives, anything. Each lives at <code>/your-slug</code> and is
            composed of blocks just like the main pages.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90"
          style={{ fontWeight: 500 }}
        >
          <Plus size={14} /> New Page
        </button>
      </div>

      {pages.length === 0 && (
        <div className="admin-card p-12 text-center text-ink/60">
          <p className="text-sm mb-2">No custom pages yet.</p>
          <p className="text-xs">
            Click "New Page" above to create a landing page, market report, or
            campaign page.
          </p>
        </div>
      )}

      {pages.length > 0 && (
        <div className="admin-card divide-y divide-ink/10">
          {pages.map((p) => (
            <div key={p.slug} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base text-ink" style={{ fontWeight: 500 }}>
                    {p.title}
                  </h3>
                  {p.published ? (
                    <span className="text-[0.6rem] tracking-[0.22em] uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      Published
                    </span>
                  ) : (
                    <span className="text-[0.6rem] tracking-[0.22em] uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                      Draft
                    </span>
                  )}
                  {p.show_in_nav && (
                    <span className="text-[0.6rem] tracking-[0.22em] uppercase px-2 py-0.5 rounded bg-navy/10 text-navy">
                      In Nav
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/65">
                  <code className="text-ink/85">/{p.slug}</code>
                  {p.description ? ` · ${p.description}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleTogglePublished(p)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-ink/5"
                  title={p.published ? "Unpublish" : "Publish"}
                >
                  {p.published ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <Link
                  href={`/admin/builder/${p.slug}`}
                  className="p-2 rounded hover:bg-ink/5"
                  aria-label="Open in Page Builder" data-tooltip="Open in Page Builder"
                >
                  <Layers size={16} />
                </Link>
                {p.published && (
                  <a
                    href={`/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded hover:bg-ink/5"
                    aria-label="Open live page" data-tooltip="Open live page"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => setEditing(p.slug)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-ink/5"
                  aria-label="Page settings" data-tooltip="Page settings"
                >
                  <Settings2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={pending}
                  className="p-2 rounded hover:bg-red-50 hover:text-red-700"
                  aria-label="Delete page" data-tooltip="Delete page"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNew && <NewPageModal onClose={() => setShowNew(false)} />}
      {editingPage && (
        <EditPageModal
          page={editingPage}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
          onNavToggle={() => handleToggleNav(editingPage)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------- NEW MODAL

function NewPageModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Auto-derive slug from title until the user manually edits the slug field
  const [slugTouched, setSlugTouched] = useState(false);
  function setTitleAndDeriveSlug(v: string) {
    setTitle(v);
    if (!slugTouched) {
      setSlug(
        v
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-"),
      );
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPage({ slug, title, description });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/admin/builder/${res.slug}`);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink/10">
          <h2 className="text-lg text-ink" style={{ fontWeight: 600 }}>
            New Page
          </h2>
          <p className="text-sm text-ink/65 mt-1">
            Create a new page. It starts as a draft — publish it whenever
            you're ready.
          </p>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="admin-label">Page Title</label>
            <input
              value={title}
              onChange={(e) => setTitleAndDeriveSlug(e.target.value)}
              className="admin-input"
              placeholder="e.g. Moving to Vienna"
            />
            <p className="text-xs text-ink/55 mt-1.5">
              Shown in the browser tab and as the page heading.
            </p>
          </div>
          <div>
            <label className="admin-label">URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink/55">/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                className="admin-input flex-1"
                placeholder="moving-to-vienna"
              />
            </div>
            <p className="text-xs text-ink/55 mt-1.5">
              Lowercase letters, numbers, and hyphens only. No spaces or
              symbols. Becomes the URL.
            </p>
          </div>
          <div>
            <label className="admin-label">Meta Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-input"
              rows={3}
              placeholder="One sentence shown on Google search results and social previews."
            />
          </div>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-ink/70 hover:text-ink px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="px-6 py-2 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90 disabled:opacity-50"
            style={{ fontWeight: 500 }}
          >
            {pending ? "Creating…" : "Create & Build"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- EDIT MODAL

function EditPageModal({
  page,
  onClose,
  onSaved,
  onNavToggle,
}: {
  page: CustomPage;
  onClose: () => void;
  onSaved: () => void;
  onNavToggle: () => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [description, setDescription] = useState(page.description ?? "");
  const [navOrder, setNavOrder] = useState(page.nav_order);
  const [showInNav, setShowInNav] = useState(page.show_in_nav);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updatePage({
        slug: page.slug,
        title,
        description,
        show_in_nav: showInNav,
        nav_order: navOrder,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSaved();
    });
    void onNavToggle;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-ink/10">
          <p
            className="text-[0.62rem] tracking-[0.28em] uppercase text-ink/55 mb-1.5"
            style={{ fontWeight: 500 }}
          >
            /{page.slug}
          </p>
          <h2 className="text-lg text-ink" style={{ fontWeight: 600 }}>
            Page Settings
          </h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="admin-label">Page Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="admin-label">Meta Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="admin-input"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showInNav}
                onChange={(e) => setShowInNav(e.target.checked)}
              />
              <span className="text-sm text-ink">Show in header nav</span>
            </label>
            <div>
              <label className="admin-label">Nav Order</label>
              <input
                type="number"
                value={navOrder}
                onChange={(e) => setNavOrder(parseInt(e.target.value, 10) || 0)}
                className="admin-input"
                disabled={!showInNav}
              />
              <p className="text-xs text-ink/55 mt-1.5">
                Lower numbers appear first.
              </p>
            </div>
          </div>
          <p className="text-xs text-ink/55">
            Slug can't be changed once a page exists. To rename, create a new
            page and copy the blocks over.
          </p>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-ink/70 hover:text-ink px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="px-6 py-2 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90 disabled:opacity-50"
            style={{ fontWeight: 500 }}
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
