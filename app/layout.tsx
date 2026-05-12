import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrandThemeStyle from "@/components/BrandThemeStyle";
import { getPortrait, getFeaturedImage } from "@/lib/contentLoader";
import { getAnalyticsMeasurementId } from "@/lib/integrationStore";
import { siteOrigin } from "@/lib/qrcode";

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
  const ogImage = await getFeaturedImage();
  return {
    metadataBase: new URL(siteOrigin()),
    title: "Samina Bilal | Northern Virginia & Maryland Real Estate",
    description:
      "Make yourself at home. Samina Bilal is a licensed Realtor with RE/MAX Galaxy serving Virginia and Maryland — Woodbridge, Stafford, Lorton, Ashburn, Manassas, Dumfries.",
    // Favicon is generated dynamically by `app/icon.tsx` (round PNG with
    // transparent corners). Next auto-discovers it; no manual entry needed.
    openGraph: {
      title: "Samina Bilal | Northern Virginia & Maryland Real Estate",
      description:
        "Make yourself at home. Boutique real estate representation across Virginia and Maryland.",
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Samina Bilal | Northern Virginia & Maryland Real Estate",
      description:
        "Make yourself at home. Boutique real estate representation across Virginia and Maryland.",
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
  const [portrait, gaMeasurementId] = await Promise.all([
    getPortrait(),
    getAnalyticsMeasurementId(),
  ]);

  return (
    <html lang="en" className={montserrat.variable}>
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
        <Header portraitAvatar={portrait.avatar} />
        <main>{children}</main>
        <Footer portraitAvatar={portrait.avatar} />
      </body>
    </html>
  );
}
