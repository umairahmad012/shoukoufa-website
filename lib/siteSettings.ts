/**
 * Site settings — runtime values that used to be hardcoded in
 * `lib/site.ts`. Reads from the singleton `site_settings` row, falling
 * back to the static `site` defaults if the DB is unavailable.
 *
 * Consumers that need brand info (Footer, Logo, MenuDrawer, About page,
 * Direct Contact block, etc.) call `getSiteSettings()` from a server
 * component and pass the resolved object down. Static defaults in
 * `lib/site.ts` are kept as a SSR-safe fallback during DB outages.
 */
import { getServiceClient } from "./contentLoader";
import { site as staticSite, nav as staticNav } from "./site";

export type NavEntry = {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
};

export type SiteSettings = {
  // Brand identity (sourced from content_blocks.brand.identity admin form
  // when present; otherwise static defaults).
  name: string;
  role: string;
  brokerage: string;
  tagline: string;
  serviceArea: string;
  languages: string[];
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  brokerageOffice: {
    name: string;
    street: string;
    cityStateZip: string;
    phone: string;
    phoneHref: string;
    logoSrc: string;
  };
  office: { street: string; cityStateZip: string };
  licenses: { va: string; md: string; dc: string };
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    youtube?: string;
    linkedin?: string;
  };
  portrait: { avatar: string; full: string };
  /** Resolved broker logo URL (Cloudinary if admin uploaded one; static fallback otherwise). */
  brokerLogo: string;
  /** Admin-editable footer copy. Empty string = use the built-in default. */
  footer: {
    copyright: string;
    credit: string;
    newsletterHeadline: string;
    newsletterBlurb: string;
  };
  /** Email notification preferences (set in /admin/settings → Notifications). */
  notificationEmail: string;
  notificationCc: string;
  notifyContact: boolean;
  notifyValuation: boolean;
  notifyForms: boolean;
  notifyRsvp: boolean;
  fixedNav: NavEntry[];
  /** Per-site prefix for support ticket numbers (e.g. "SH" → SH-0007). */
  supportTicketPrefix: string;
};

const DEFAULT_FOOTER_COPY = {
  copyright: "",
  credit: "Site by Brand Bonjour",
  newsletterHeadline: "Newsletter",
  newsletterBlurb:
    "Quarterly market reports for the DMV — Virginia, Maryland & D.C. New listings, sold prices, and what it means for your zip code. No spam, ever.",
};

/** Default fixed-nav order matching the hardcoded `nav` array shape. */
const DEFAULT_FIXED_NAV: NavEntry[] = [
  { key: "home", label: "Home", enabled: true, order: 10 },
  { key: "about", label: "About", enabled: true, order: 20 },
  { key: "buyers", label: "Buyers", enabled: true, order: 30 },
  { key: "sellers", label: "Sellers", enabled: true, order: 40 },
  { key: "invest", label: "Invest", enabled: true, order: 50 },
  { key: "communities", label: "Communities", enabled: true, order: 60 },
  { key: "closings", label: "Recent Closings", enabled: true, order: 70 },
  { key: "partners", label: "Trusted Partners", enabled: true, order: 80 },
  { key: "reviews", label: "Reviews", enabled: true, order: 90 },
  { key: "contact", label: "Contact", enabled: true, order: 100 },
];

/**
 * Map a fixed-nav key to the href used by the public site. Keep in
 * sync with the route folders.
 */
export const FIXED_NAV_HREF: Record<string, string> = {
  home: "/",
  about: "/about",
  buyers: "/buyers",
  sellers: "/sellers",
  invest: "/invest",
  communities: "/communities",
  closings: "/closings",
  partners: "/partners",
  reviews: "/reviews",
  contact: "/contact",
};

/**
 * Read brand identity (name / role / brokerage / tagline / serviceArea
 * / languages) from `content_blocks.brand.identity`. Returns `null`
 * when the admin has never saved the form — the caller falls back to
 * `lib/site.ts` defaults in that case.
 */
type BrandIdentity = {
  name?: string;
  role?: string;
  brokerage?: string;
  tagline?: string;
  serviceArea?: string;
  languages?: string[];
};

async function readBrandIdentity(): Promise<BrandIdentity | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data: row } = await supabase
    .from("content_blocks")
    .select("value")
    .eq("page", "brand")
    .eq("key", "identity")
    .maybeSingle();
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value as string);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as BrandIdentity;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** Read site_settings + brand.identity from DB; merge with static defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  // Lazy import to avoid a circular dep between siteSettings and contentLoader.
  const { getPortrait, getBrokerLogo } = await import("./contentLoader");

  const fallback: SiteSettings = {
    name: staticSite.name,
    role: staticSite.role,
    brokerage: staticSite.brokerage,
    tagline: staticSite.tagline,
    serviceArea: staticSite.serviceArea,
    languages: [...staticSite.languages],
    phone: staticSite.phone,
    phoneHref: staticSite.phoneHref,
    email: staticSite.email,
    emailHref: staticSite.emailHref,
    brokerageOffice: { ...staticSite.brokerageOffice },
    office: { ...staticSite.office },
    licenses: {
      va: staticSite.licenses.va,
      md: staticSite.licenses.md,
      dc: (staticSite.licenses as { dc?: string }).dc ?? "",
    },
    social: { ...staticSite.social },
    portrait: { ...staticSite.portrait },
    brokerLogo: "/images/Remax%20Galaxy.png",
    footer: { ...DEFAULT_FOOTER_COPY },
    notificationEmail: "",
    notificationCc: "",
    notifyContact: true,
    notifyValuation: true,
    notifyForms: true,
    notifyRsvp: true,
    fixedNav: DEFAULT_FIXED_NAV,
    supportTicketPrefix: "BB",
  };

  // Pull all three sources in parallel: site_settings row, brand identity
  // content block, and the resolved portrait + broker logo URLs.
  const supabase = getServiceClient();

  const [siteRow, brandIdentity, portrait, brokerLogo] = await Promise.all([
    supabase
      ? supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
      : Promise.resolve({ data: null }),
    readBrandIdentity(),
    getPortrait(),
    getBrokerLogo(),
  ]);

  const row = (siteRow.data as Record<string, unknown> | null) ?? null;

  return {
    // Identity comes from content_blocks.brand.identity (admin form);
    // each field falls back to the static default if unset.
    name: brandIdentity?.name?.trim() || fallback.name,
    role: brandIdentity?.role?.trim() || fallback.role,
    brokerage: brandIdentity?.brokerage?.trim() || fallback.brokerage,
    tagline: brandIdentity?.tagline?.trim() || fallback.tagline,
    serviceArea: brandIdentity?.serviceArea?.trim() || fallback.serviceArea,
    languages:
      Array.isArray(brandIdentity?.languages) && brandIdentity!.languages!.length > 0
        ? (brandIdentity!.languages as string[])
        : fallback.languages,
    // Contact + office + licenses + social + nav come from site_settings.
    phone: (row?.phone as string) || fallback.phone,
    phoneHref: (row?.phone_href as string) || fallback.phoneHref,
    email: (row?.email as string) || fallback.email,
    emailHref: (row?.email_href as string) || fallback.emailHref,
    brokerageOffice: {
      name:
        (row?.brokerage_office_name as string) || fallback.brokerageOffice.name,
      street:
        (row?.brokerage_office_street as string) || fallback.brokerageOffice.street,
      cityStateZip:
        (row?.brokerage_office_city_state_zip as string) ||
        fallback.brokerageOffice.cityStateZip,
      phone:
        (row?.brokerage_office_phone as string) || fallback.brokerageOffice.phone,
      phoneHref:
        (row?.brokerage_office_phone_href as string) ||
        fallback.brokerageOffice.phoneHref,
      logoSrc: brokerLogo || fallback.brokerageOffice.logoSrc,
    },
    office: fallback.office,
    licenses: {
      va: (row?.license_va as string) || fallback.licenses.va,
      md: (row?.license_md as string) || fallback.licenses.md,
      dc: (row?.license_dc as string) || fallback.licenses.dc,
    },
    social: {
      instagram: (row?.instagram_url as string) || fallback.social.instagram,
      facebook: (row?.facebook_url as string) || fallback.social.facebook,
      tiktok: (row?.tiktok_url as string) || fallback.social.tiktok,
      youtube: (row?.youtube_url as string) || undefined,
      linkedin: (row?.linkedin_url as string) || undefined,
    },
    portrait,
    brokerLogo,
    footer: {
      copyright: (row?.footer_copyright as string) || fallback.footer.copyright,
      credit: (row?.footer_credit as string) || fallback.footer.credit,
      newsletterHeadline:
        (row?.footer_newsletter_headline as string) ||
        fallback.footer.newsletterHeadline,
      newsletterBlurb:
        (row?.footer_newsletter_blurb as string) ||
        fallback.footer.newsletterBlurb,
    },
    notificationEmail:
      (row?.notification_email as string | null)?.trim() || "",
    notificationCc: (row?.notification_cc as string | null)?.trim() || "",
    notifyContact:
      typeof row?.notify_contact === "boolean" ? row.notify_contact : true,
    notifyValuation:
      typeof row?.notify_valuation === "boolean" ? row.notify_valuation : true,
    notifyForms:
      typeof row?.notify_forms === "boolean" ? row.notify_forms : true,
    notifyRsvp:
      typeof row?.notify_rsvp === "boolean" ? row.notify_rsvp : true,
    fixedNav: Array.isArray(row?.fixed_nav)
      ? (row!.fixed_nav as NavEntry[])
      : fallback.fixedNav,
    supportTicketPrefix:
      (row?.support_ticket_prefix as string | null)?.trim() ||
      fallback.supportTicketPrefix,
  };
}

/** Per-page metadata (title + description) for the 10 fixed pages. */
export type PageMetaRow = {
  page_key: string;
  title: string;
  description: string | null;
};

export async function getPageMeta(
  pageKey: string,
): Promise<PageMetaRow | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("page_meta")
    .select("page_key, title, description")
    .eq("page_key", pageKey)
    .maybeSingle();
  return (data as PageMetaRow | null) ?? null;
}

export async function getAllPageMeta(): Promise<PageMetaRow[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("page_meta")
    .select("page_key, title, description")
    .order("page_key");
  return (data as PageMetaRow[] | null) ?? [];
}

/**
 * Build a complete Next.js Metadata object for a fixed page. Centralizes
 * title + description + og:image so per-page generateMetadata() doesn't
 * accidentally drop openGraph.images (which Next.js shallow-merges out
 * when a page overrides only title/description in its openGraph block).
 *
 * Fallback strategy (cloned-site-friendly):
 *   1. If admin has filled in page_meta for this key → use that.
 *   2. Else generate a unique, agent-aware fallback from getSiteSettings()
 *      — so a freshly-cloned site (John Doe, ACME Realty) already has
 *      distinct per-page titles for SEO without anyone editing the SEO
 *      panel first. Once Shoukoufa/clone-agent edits the per-page meta
 *      in /admin/seo, those values transparently take over.
 */
export async function buildPageMetadata(pageKey: string) {
  const [meta, featured, settings] = await Promise.all([
    getPageMeta(pageKey),
    // Import lazily to avoid a circular dep between siteSettings and contentLoader.
    import("./contentLoader").then((m) => m.getFeaturedImage()),
    getSiteSettings(),
  ]);

  const fallback = buildFallbackPageMeta(pageKey, settings);
  const title = meta?.title || fallback.title;
  const description = meta?.description || fallback.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(featured ? { images: [{ url: featured }] } : {}),
    },
    twitter: {
      title,
      description,
      ...(featured ? { images: [featured] } : {}),
    },
  };
}

/**
 * Per-page fallback titles + descriptions, generated from the live
 * site settings. Keeps cloned sites SEO-friendly even before admin
 * fills in the per-page SEO editor.
 *
 * Add new page keys here when new fixed pages are introduced. Custom
 * pages (block-builder) get their own metadata via their loader, not
 * through buildPageMetadata().
 */
/** Exposed for the admin SEO editor so it can show admins what the
 *  fallback would look like before they override. */
export function buildFallbackPageMeta(
  pageKey: string,
  s: SiteSettings,
): { title: string; description: string } {
  const name = s.name;
  const role = s.role || "Real Estate Specialist";
  const area = s.serviceArea || "the DMV";
  const brokerage = s.brokerage || "";
  const brokerageBit = brokerage ? ` with ${brokerage}` : "";

  switch (pageKey) {
    case "home":
      return {
        title: `${name} | ${role} · ${area}`,
        description: `${name} is a licensed ${role}${brokerageBit}, serving ${area}. ${s.tagline || "Boutique real estate representation."}`,
      };
    case "about":
      return {
        title: `About ${name} | ${role}`,
        description: `Meet ${name} — ${role}${brokerageBit}. ${s.tagline || `Local expertise across ${area}.`}`,
      };
    case "buyers":
      return {
        title: `Buying a Home | ${name} — ${area} Buyer's Agent`,
        description: `Looking to buy in ${area}? ${name} guides first-time buyers and seasoned investors through every step — search to closing.`,
      };
    case "sellers":
      return {
        title: `Selling Your Home | ${name} — ${area} Listing Agent`,
        description: `Considering selling in ${area}? ${name} delivers concierge listing service: pricing strategy, staging, marketing, negotiation.`,
      };
    case "invest":
      return {
        title: `Investment Real Estate | ${name} — ${area}`,
        description: `${name} works with investors across ${area} — rentals, flips, multifamily, 1031 exchanges, and long-term wealth building through real estate.`,
      };
    case "communities":
      return {
        title: `Communities | ${name}`,
        description: `Explore the ${area} neighborhoods ${name} knows best — schools, lifestyle, market trends, and what each community is really like to live in.`,
      };
    case "closings":
      return {
        title: `Recent Closings | ${name}`,
        description: `A portfolio of recent transactions closed by ${name}${brokerageBit} across ${area}.`,
      };
    case "partners":
      return {
        title: `Trusted Partners | ${name}`,
        description: `Lenders, inspectors, contractors, designers — the vetted professionals ${name} recommends for every step of a real estate transaction.`,
      };
    case "reviews":
      return {
        title: `Client Reviews | ${name} — ${role}`,
        description: `Read what past clients have said about working with ${name}${brokerageBit}.`,
      };
    case "contact":
      return {
        title: `Contact ${name} | ${role}`,
        description: `Reach ${name} directly — phone, email, or schedule a consultation. ${role}${brokerageBit}, serving ${area}.`,
      };
    case "privacy":
      return {
        title: `Privacy Policy | ${name}`,
        description: `How ${name} and this website collect, use, and protect visitor information.`,
      };
    default:
      return {
        title: `${name} | ${role}`,
        description: s.tagline || `${role}${brokerageBit}, serving ${area}.`,
      };
  }
}

// Reference staticNav so the import isn't unused if we ever switch to a
// runtime nav assembly that needs the original href map.
void staticNav;
