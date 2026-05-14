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
  name: string;
  tagline: string;
  brokerage: string;
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
  fixedNav: NavEntry[];
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

/** Read site_settings from DB; merge with static defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const fallback: SiteSettings = {
    name: staticSite.name,
    tagline: staticSite.tagline,
    brokerage: staticSite.brokerage,
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
    fixedNav: DEFAULT_FIXED_NAV,
  };

  const supabase = getServiceClient();
  if (!supabase) return fallback;

  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return fallback;

  const row = data as Record<string, unknown>;

  return {
    name: fallback.name,
    tagline: fallback.tagline,
    brokerage: fallback.brokerage,
    phone: (row.phone as string) || fallback.phone,
    phoneHref: (row.phone_href as string) || fallback.phoneHref,
    email: (row.email as string) || fallback.email,
    emailHref: (row.email_href as string) || fallback.emailHref,
    brokerageOffice: {
      name: (row.brokerage_office_name as string) || fallback.brokerageOffice.name,
      street: (row.brokerage_office_street as string) || fallback.brokerageOffice.street,
      cityStateZip:
        (row.brokerage_office_city_state_zip as string) ||
        fallback.brokerageOffice.cityStateZip,
      phone: (row.brokerage_office_phone as string) || fallback.brokerageOffice.phone,
      phoneHref:
        (row.brokerage_office_phone_href as string) || fallback.brokerageOffice.phoneHref,
      logoSrc: fallback.brokerageOffice.logoSrc,
    },
    office: fallback.office,
    licenses: {
      va: (row.license_va as string) || fallback.licenses.va,
      md: (row.license_md as string) || fallback.licenses.md,
      dc: (row.license_dc as string) || fallback.licenses.dc,
    },
    social: {
      instagram: (row.instagram_url as string) || fallback.social.instagram,
      facebook: (row.facebook_url as string) || fallback.social.facebook,
      tiktok: (row.tiktok_url as string) || fallback.social.tiktok,
      youtube: (row.youtube_url as string) || undefined,
      linkedin: (row.linkedin_url as string) || undefined,
    },
    portrait: fallback.portrait,
    fixedNav: Array.isArray(row.fixed_nav)
      ? (row.fixed_nav as NavEntry[])
      : fallback.fixedNav,
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
 */
export async function buildPageMetadata(pageKey: string) {
  const [meta, featured] = await Promise.all([
    getPageMeta(pageKey),
    // Import lazily to avoid a circular dep between siteSettings and contentLoader.
    import("./contentLoader").then((m) => m.getFeaturedImage()),
  ]);
  if (!meta) {
    // Even with no row, include the og:image so shares of an unconfigured
    // page still get the brand featured photo.
    return {
      openGraph: featured ? { images: [{ url: featured }] } : undefined,
      twitter: featured ? { images: [featured] } : undefined,
    };
  }
  return {
    title: meta.title,
    description: meta.description ?? undefined,
    openGraph: {
      title: meta.title,
      description: meta.description ?? undefined,
      ...(featured ? { images: [{ url: featured }] } : {}),
    },
    twitter: {
      title: meta.title,
      description: meta.description ?? undefined,
      ...(featured ? { images: [featured] } : {}),
    },
  };
}

// Reference staticNav so the import isn't unused if we ever switch to a
// runtime nav assembly that needs the original href map.
void staticNav;
