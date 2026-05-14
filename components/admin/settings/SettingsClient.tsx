"use client";

/**
 * Site Settings admin — three tabs in one screen:
 *   1) Contact    — phone, email, brokerage office, licenses
 *   2) Social     — Instagram / Facebook / TikTok / YouTube / LinkedIn URLs
 *   3) Header Nav — toggle + reorder fixed nav items
 *   4) Page Meta  — title + meta description per fixed page
 *
 * Each tab has its own save action; saves trigger a full revalidate so
 * the public site picks up changes immediately.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import type { SiteSettings, NavEntry, PageMetaRow } from "@/lib/siteSettings";
import { updateSiteSettings, updatePageMeta } from "@/app/admin/settings/actions";

type Tab = "contact" | "social" | "nav" | "meta" | "footer";

export default function SettingsClient({
  initialSettings,
  initialPageMeta,
}: {
  initialSettings: SiteSettings;
  initialPageMeta: PageMetaRow[];
}) {
  const [tab, setTab] = useState<Tab>("contact");
  const [settings, setSettings] = useState<SiteSettings>(initialSettings);
  const [pageMeta, setPageMeta] = useState<PageMetaRow[]>(initialPageMeta);

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <p
          className="text-[0.65rem] tracking-[0.32em] uppercase text-ink/55 mb-3"
          style={{ fontWeight: 500 }}
        >
          Site Editor · Settings
        </p>
        <h1
          className="text-2xl md:text-3xl text-ink mb-2"
          style={{ fontWeight: 600 }}
        >
          Site Settings
        </h1>
        <p className="text-sm text-ink/65 max-w-xl">
          Edit phone, email, social links, licenses, the header navigation, and
          per-page metadata. Changes go live as soon as you save.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-ink/15">
        <TabButton active={tab === "contact"} onClick={() => setTab("contact")}>
          Contact
        </TabButton>
        <TabButton active={tab === "social"} onClick={() => setTab("social")}>
          Social
        </TabButton>
        <TabButton active={tab === "nav"} onClick={() => setTab("nav")}>
          Header Nav
        </TabButton>
        <TabButton active={tab === "meta"} onClick={() => setTab("meta")}>
          Page Metadata
        </TabButton>
        <TabButton active={tab === "footer"} onClick={() => setTab("footer")}>
          Footer Copy
        </TabButton>
      </div>

      {tab === "contact" && (
        <ContactTab settings={settings} setSettings={setSettings} />
      )}
      {tab === "social" && (
        <SocialTab settings={settings} setSettings={setSettings} />
      )}
      {tab === "nav" && (
        <NavTab settings={settings} setSettings={setSettings} />
      )}
      {tab === "meta" && (
        <MetaTab pageMeta={pageMeta} setPageMeta={setPageMeta} />
      )}
      {tab === "footer" && (
        <FooterTab settings={settings} setSettings={setSettings} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm transition-colors -mb-px border-b-2 ${
        active
          ? "text-navy border-navy"
          : "text-ink/60 border-transparent hover:text-ink"
      }`}
      style={{ fontWeight: active ? 600 : 400 }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────── CONTACT TAB

function ContactTab({
  settings,
  setSettings,
}: {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSiteSettings({
        phone: settings.phone,
        phone_href: settings.phoneHref,
        email: settings.email,
        email_href: settings.emailHref,
        brokerage_office_name: settings.brokerageOffice.name,
        brokerage_office_street: settings.brokerageOffice.street,
        brokerage_office_city_state_zip: settings.brokerageOffice.cityStateZip,
        brokerage_office_phone: settings.brokerageOffice.phone,
        brokerage_office_phone_href: settings.brokerageOffice.phoneHref,
        license_va: settings.licenses.va,
        license_md: settings.licenses.md,
        license_dc: settings.licenses.dc,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Section title="Direct Contact">
        <Field
          label="Phone (display)"
          value={settings.phone}
          onChange={(v) => setSettings({ ...settings, phone: v })}
          placeholder="(703) 307-0889"
        />
        <Field
          label="Phone (tel: link)"
          value={settings.phoneHref}
          onChange={(v) => setSettings({ ...settings, phoneHref: v })}
          placeholder="tel:+17033070889"
          help="Used as the href on click-to-call links. Format: tel:+17033070889"
        />
        <Field
          label="Email"
          value={settings.email}
          onChange={(v) => setSettings({ ...settings, email: v })}
          placeholder="realtor@shoukoufahomes.com"
        />
        <Field
          label="Email (mailto: link)"
          value={settings.emailHref}
          onChange={(v) => setSettings({ ...settings, emailHref: v })}
          placeholder="mailto:realtor@shoukoufahomes.com"
        />
      </Section>

      <Section title="Brokerage Office">
        <Field
          label="Brokerage Name"
          value={settings.brokerageOffice.name}
          onChange={(v) =>
            setSettings({
              ...settings,
              brokerageOffice: { ...settings.brokerageOffice, name: v },
            })
          }
        />
        <Field
          label="Street"
          value={settings.brokerageOffice.street}
          onChange={(v) =>
            setSettings({
              ...settings,
              brokerageOffice: { ...settings.brokerageOffice, street: v },
            })
          }
        />
        <Field
          label="City, State Zip"
          value={settings.brokerageOffice.cityStateZip}
          onChange={(v) =>
            setSettings({
              ...settings,
              brokerageOffice: { ...settings.brokerageOffice, cityStateZip: v },
            })
          }
        />
        <Field
          label="Brokerage Phone (display)"
          value={settings.brokerageOffice.phone}
          onChange={(v) =>
            setSettings({
              ...settings,
              brokerageOffice: { ...settings.brokerageOffice, phone: v },
            })
          }
        />
        <Field
          label="Brokerage Phone (tel: link)"
          value={settings.brokerageOffice.phoneHref}
          onChange={(v) =>
            setSettings({
              ...settings,
              brokerageOffice: { ...settings.brokerageOffice, phoneHref: v },
            })
          }
        />
      </Section>

      <Section title="Licenses">
        <Field
          label="Virginia License #"
          value={settings.licenses.va}
          onChange={(v) =>
            setSettings({ ...settings, licenses: { ...settings.licenses, va: v } })
          }
        />
        <Field
          label="Maryland License #"
          value={settings.licenses.md}
          onChange={(v) =>
            setSettings({ ...settings, licenses: { ...settings.licenses, md: v } })
          }
        />
        <Field
          label="D.C. License #"
          value={settings.licenses.dc}
          onChange={(v) =>
            setSettings({ ...settings, licenses: { ...settings.licenses, dc: v } })
          }
        />
      </Section>

      <SaveBar onSave={save} pending={pending} savedAt={savedAt} error={error} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────── SOCIAL TAB

function SocialTab({
  settings,
  setSettings,
}: {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSiteSettings({
        instagram_url: settings.social.instagram,
        facebook_url: settings.social.facebook,
        tiktok_url: settings.social.tiktok,
        youtube_url: settings.social.youtube,
        linkedin_url: settings.social.linkedin,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Section title="Social URLs">
        <Field
          label="Instagram"
          value={settings.social.instagram}
          onChange={(v) =>
            setSettings({ ...settings, social: { ...settings.social, instagram: v } })
          }
          placeholder="https://www.instagram.com/realtorshoukoufa_dmv/"
        />
        <Field
          label="Facebook"
          value={settings.social.facebook}
          onChange={(v) =>
            setSettings({ ...settings, social: { ...settings.social, facebook: v } })
          }
          placeholder="https://www.facebook.com/ShoukoufaHomes/"
        />
        <Field
          label="TikTok"
          value={settings.social.tiktok}
          onChange={(v) =>
            setSettings({ ...settings, social: { ...settings.social, tiktok: v } })
          }
          placeholder="https://www.tiktok.com/@shoukoufahomes_"
        />
        <Field
          label="YouTube (optional)"
          value={settings.social.youtube ?? ""}
          onChange={(v) =>
            setSettings({ ...settings, social: { ...settings.social, youtube: v } })
          }
          placeholder="https://www.youtube.com/@..."
        />
        <Field
          label="LinkedIn (optional)"
          value={settings.social.linkedin ?? ""}
          onChange={(v) =>
            setSettings({ ...settings, social: { ...settings.social, linkedin: v } })
          }
          placeholder="https://www.linkedin.com/in/..."
        />
      </Section>

      <SaveBar onSave={save} pending={pending} savedAt={savedAt} error={error} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────── NAV TAB

function NavTab({
  settings,
  setSettings,
}: {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(idx: number, patch: Partial<NavEntry>) {
    const next = [...settings.fixedNav];
    next[idx] = { ...next[idx], ...patch };
    setSettings({ ...settings, fixedNav: next });
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= settings.fixedNav.length) return;
    const next = [...settings.fixedNav];
    [next[idx], next[j]] = [next[j], next[idx]];
    // Re-number to keep things tidy
    next.forEach((n, i) => (n.order = (i + 1) * 10));
    setSettings({ ...settings, fixedNav: next });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSiteSettings({ fixed_nav: settings.fixedNav });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div>
      <p className="text-sm text-ink/65 mb-4">
        Toggle which fixed routes appear in the header menu and reorder them.
        Custom pages (managed in <code>Pages</code>) appear automatically when
        their "Show in header nav" toggle is on.
      </p>

      <div className="admin-card divide-y divide-ink/10">
        {settings.fixedNav.map((entry, i) => (
          <div key={entry.key} className="px-5 py-3 flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0 || pending}
                className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === settings.fixedNav.length - 1 || pending}
                className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown size={14} />
              </button>
            </div>

            <button
              onClick={() => update(i, { enabled: !entry.enabled })}
              disabled={pending}
              className="p-2 rounded hover:bg-ink/5"
              title={entry.enabled ? "Hide" : "Show"}
            >
              {entry.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <div className="flex-1 min-w-0">
              <code className="text-[0.65rem] tracking-[0.22em] uppercase text-ink/55">
                /{entry.key === "home" ? "" : entry.key}
              </code>
              <input
                value={entry.label}
                onChange={(e) => update(i, { label: e.target.value })}
                className="admin-input mt-1"
              />
            </div>
          </div>
        ))}
      </div>

      <SaveBar onSave={save} pending={pending} savedAt={savedAt} error={error} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────── META TAB

function MetaTab({
  pageMeta,
  setPageMeta,
}: {
  pageMeta: PageMetaRow[];
  setPageMeta: (rows: PageMetaRow[]) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  function update(idx: number, patch: Partial<PageMetaRow>) {
    const next = [...pageMeta];
    next[idx] = { ...next[idx], ...patch };
    setPageMeta(next);
  }

  function save(row: PageMetaRow) {
    setSavingKey(row.page_key);
    startTransition(async () => {
      const res = await updatePageMeta({
        page_key: row.page_key,
        title: row.title,
        description: row.description ?? "",
      });
      setSavingKey(null);
      if (res.ok) router.refresh();
      else alert(`Save failed: ${res.error}`);
    });
  }

  return (
    <div>
      <p className="text-sm text-ink/65 mb-4">
        Title appears in the browser tab and Google search results. Description
        shows on Google + social previews. ~50–60 chars for title, ~150 for
        description is ideal.
      </p>

      <div className="space-y-4">
        {pageMeta.map((row, i) => (
          <div key={row.page_key} className="admin-card p-5">
            <div className="flex items-center justify-between mb-3">
              <code className="text-[0.62rem] tracking-[0.28em] uppercase text-ink/55">
                /{row.page_key === "home" ? "" : row.page_key}
              </code>
              <button
                onClick={() => save(row)}
                disabled={pending && savingKey === row.page_key}
                className="text-[0.62rem] tracking-[0.22em] uppercase px-3 py-1.5 bg-navy text-white rounded hover:opacity-90 disabled:opacity-50"
                style={{ fontWeight: 500 }}
              >
                {pending && savingKey === row.page_key ? "Saving…" : "Save"}
              </button>
            </div>
            <input
              value={row.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="admin-input mb-3"
              placeholder="Page title"
            />
            <textarea
              value={row.description ?? ""}
              onChange={(e) => update(i, { description: e.target.value })}
              className="admin-input"
              rows={2}
              placeholder="Meta description"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── SHARED

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-card p-6">
      <h2
        className="text-[0.7rem] tracking-[0.3em] uppercase text-ink/65 mb-5"
        style={{ fontWeight: 600 }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── FOOTER TAB

function FooterTab({
  settings,
  setSettings,
}: {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SiteSettings["footer"]>(
    key: K,
    val: SiteSettings["footer"][K],
  ) {
    setSettings({
      ...settings,
      footer: { ...settings.footer, [key]: val },
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateSiteSettings({
        footer_copyright: settings.footer.copyright,
        footer_credit: settings.footer.credit,
        footer_newsletter_headline: settings.footer.newsletterHeadline,
        footer_newsletter_blurb: settings.footer.newsletterBlurb,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date());
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <Section title="Bottom bar">
        <Field
          label="Copyright line"
          value={settings.footer.copyright}
          onChange={(v) => set("copyright", v)}
          placeholder="Leave blank to auto-build from realtor name + license states"
          help='Example: "© 2026 Shoukoufa Aboubakri · Licensed in VA, MD & DC". Empty falls back to an auto-built line.'
        />
        <Field
          label="Design credit"
          value={settings.footer.credit}
          onChange={(v) => set("credit", v)}
          placeholder='"Copyrights reserved by Brand Bonjour"'
          help="Shown next to the small logo at the bottom right. Set to a single space character to hide it entirely."
        />
      </Section>
      <Section title="Newsletter block">
        <Field
          label="Headline"
          value={settings.footer.newsletterHeadline}
          onChange={(v) => set("newsletterHeadline", v)}
          placeholder="Newsletter"
        />
        <div>
          <label className="admin-label">Blurb</label>
          <textarea
            rows={4}
            className="admin-input w-full"
            value={settings.footer.newsletterBlurb}
            onChange={(e) => set("newsletterBlurb", e.target.value)}
          />
          <p className="text-[11px] text-ink/50 mt-1.5">
            Short paragraph shown above the email field. ~2 lines is the sweet
            spot — gets cropped on phone if longer.
          </p>
        </div>
      </Section>
      <SaveBar
        pending={pending}
        onSave={save}
        savedAt={savedAt}
        error={error}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-input"
      />
      {help ? <p className="text-xs text-ink/55 mt-1.5">{help}</p> : null}
    </div>
  );
}

function SaveBar({
  onSave,
  pending,
  savedAt,
  error,
}: {
  onSave: () => void;
  pending: boolean;
  savedAt: Date | null;
  error: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <div className="text-xs text-ink/55">
        {error ? (
          <span className="text-red-700">{error}</span>
        ) : savedAt ? (
          <span className="text-emerald-700">
            Saved at {savedAt.toLocaleTimeString()}
          </span>
        ) : (
          "Changes go live immediately when you save."
        )}
      </div>
      <button
        onClick={onSave}
        disabled={pending}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-navy text-white text-[0.7rem] tracking-[0.28em] uppercase rounded hover:opacity-90 disabled:opacity-50"
        style={{ fontWeight: 500 }}
      >
        <Save size={14} /> {pending ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
