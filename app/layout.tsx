import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandThemeStyle from "@/components/BrandThemeStyle";
import PageTransitionLoader from "@/components/PageTransitionLoader";
import ParallaxScroll from "@/components/ParallaxScroll";
import { getPortrait, getFeaturedImage } from "@/lib/contentLoader";
import { getAnalyticsMeasurementId } from "@/lib/integrationStore";
import { siteOrigin } from "@/lib/qrcode";
import { getNavPages } from "@/lib/customPages";
import { getSiteSettings, FIXED_NAV_HREF, getPageMeta } from "@/lib/siteSettings";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

/**
 * Site-wide metadata is now resolved dynamically so the favicon and the
 * default social-share image can be edited from the admin Brand Identity
 * section instead of being baked into a static export.
 *
 * Page-level `generateMetadata` (e.g. on /open-house/[slug]) overrides
 * specific fields like `openGraph.images` per page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [ogImage, homeMeta] = await Promise.all([
    getFeaturedImage(),
    getPageMeta("home"),
  ]);
  // Hardcoded strings preserved as fallback so behavior is identical when
  // page_meta('home') is empty. Once Shoukoufa edits the home title in
  // /admin/seo, those values automatically replace these defaults — no
  // code change needed.
  const fallbackTitle =
    "Shoukoufa Aboubakri | Real Estate Specialist · Virginia · Maryland · D.C.";
  const fallbackDescription =
    "Building legacies, one house at a time. Shoukoufa Aboubakri is a licensed Real Estate Specialist with REMAX Galaxy, serving the DMV — Virginia, Maryland, and Washington D.C.";
  const fallbackOgDescription =
    "Building legacies, one house at a time. Boutique real estate representation across the DMV.";
  const title = homeMeta?.title || fallbackTitle;
  const description = homeMeta?.description || fallbackDescription;
  const ogDescription = homeMeta?.description || fallbackOgDescription;
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    // Favicon is generated dynamically by `app/icon.tsx` (round PNG with
    // transparent corners). Next auto-discovers it; no manual entry needed.
    openGraph: {
      title,
      description: ogDescription,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the portrait + Analytics ID once at the layout level so children
  // don't each re-fetch. When admin pastes a GA Measurement ID via
  // /admin/integrations/analytics, this becomes a string like "G-XXXX...";
  // when blank or disabled, GA scripts simply don't render.
  const [portrait, gaMeasurementId, navPages, settings] = await Promise.all([
    getPortrait(),
    getAnalyticsMeasurementId(),
    getNavPages(),
    getSiteSettings(),
  ]);
  // Build the full nav from the editable fixed_nav (enabled + ordered)
  // followed by the custom pages flagged "Show in header nav".
  const fixedNavItems = [...settings.fixedNav]
    .filter((n) => n.enabled && FIXED_NAV_HREF[n.key])
    .sort((a, b) => a.order - b.order)
    .map((n) => ({ label: n.label, href: FIXED_NAV_HREF[n.key] }));
  const customNavItems = navPages.map((p) => ({
    label: p.title,
    href: `/${p.slug}`,
  }));
  const extraNavItems = [...customNavItems];

  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        {/* Open the TCP/TLS connection to Cloudinary as early as the
            HTML parses, so the moment the CSS references the hero
            background-image we don't pay handshake cost. Shaves
            200-500ms off LCP on cold loads. */}
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        {/* Google Analytics 4 — auto-injected when configured in admin.
            `next/script` with strategy="afterInteractive" loads gtag.js
            after hydration so it doesn't block the first paint. */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { send_page_view: true });
              `}
            </Script>
          </>
        )}

        {/* Reads saved brand theme and overrides --brand-* CSS variables
            so navy/cream switches re-skin the entire site. */}
        <BrandThemeStyle />
        {/* Fullscreen gold-on-dark overlay on every route change.
            Self-hides inside /admin so editing isn't interrupted. */}
        <PageTransitionLoader />
        <ParallaxScroll />
        <Header
          portraitAvatar={portrait.avatar}
          fixedNavItems={fixedNavItems}
          extraNavItems={extraNavItems}
          name={settings.name}
          role={settings.role}
          phone={settings.phone}
          phoneHref={settings.phoneHref}
          email={settings.email}
          emailHref={settings.emailHref}
        />
        <main>{children}</main>
        <Footer portraitAvatar={portrait.avatar} settings={settings} />
      </body>
    </html>
  );
}
