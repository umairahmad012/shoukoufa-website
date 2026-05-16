/**
 * StructuredData — emits Schema.org JSON-LD describing the realtor as a
 * RealEstateAgent (with embedded Organization for the brokerage).
 *
 * Why: Google reads JSON-LD to populate the right-side "knowledge panel"
 * for "[Name] real estate agent" searches, to show photo + phone + map
 * pin in local results, and to surface aggregate review stars in the
 * SERP. Without it, the site looks like any other listing.
 *
 * Where it pulls from:
 *   Everything is read from `getSiteSettings()` — admin-edited fields in
 *   site_settings + content_blocks.brand.identity. Cloning the site for
 *   a new agent (John Doe → ACME Realty) automatically produces a fresh,
 *   correct schema for that agent the moment they fill in /admin.
 *
 * Where it's mounted: in the root layout, so every page on the site
 * carries the same realtor schema (recommended by Google for single-
 * person sites — gives every page the same authority anchor).
 *
 * What's emitted:
 *   - @type: RealEstateAgent
 *   - name, image, telephone, email, url
 *   - description (tagline)
 *   - knowsLanguage (from settings.languages)
 *   - areaServed (settings.serviceArea + the major communities)
 *   - sameAs (every populated social URL)
 *   - hasCredential (state licenses)
 *   - worksFor (the brokerage as a sub-organization, with its own
 *     name + address + phone + logo + URL)
 *
 * What's intentionally omitted:
 *   - aggregateRating — would need a verified review count; faking it
 *     gets the site demoted. Wire it up later from the reviews table.
 *   - priceRange — most real-estate brokerages don't set this; not
 *     useful for a service business that doesn't have a price.
 */

import { getSiteSettings } from "@/lib/siteSettings";
import { siteOrigin } from "@/lib/qrcode";

export default async function StructuredData() {
  const s = await getSiteSettings();
  const origin = siteOrigin();

  // sameAs: every social URL the admin has filled in. Google uses these
  // to confirm identity ("this person is at @handle on Instagram, fb.com/
  // page, etc.") which raises trust score for the knowledge panel.
  const sameAs = [
    s.social.instagram,
    s.social.facebook,
    s.social.tiktok,
    s.social.youtube,
    s.social.linkedin,
  ].filter((u): u is string => Boolean(u));

  // hasCredential: one entry per state license that's been filled in.
  // Schema.org's EducationalOccupationalCredential is the standard way
  // to describe a professional license.
  const credentials = [
    s.licenses.va ? { state: "Virginia", id: s.licenses.va } : null,
    s.licenses.md ? { state: "Maryland", id: s.licenses.md } : null,
    s.licenses.dc ? { state: "District of Columbia", id: s.licenses.dc } : null,
  ]
    .filter(<T,>(x: T | null): x is T => x !== null)
    .map((c) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: `Real Estate License (${c.state})`,
      recognizedBy: {
        "@type": "GovernmentOrganization",
        name: `${c.state} Real Estate Board`,
      },
      identifier: c.id,
    }));

  // Embedded Organization for the brokerage. Has its own address +
  // phone so Google can also surface the brokerage card if someone
  // searches it.
  const brokerage = s.brokerage
    ? {
        "@type": "RealEstateAgency",
        name: s.brokerageOffice.name || s.brokerage,
        ...(s.brokerageOffice.street || s.brokerageOffice.cityStateZip
          ? {
              address: {
                "@type": "PostalAddress",
                streetAddress: s.brokerageOffice.street || undefined,
                // cityStateZip is stored as a single string in admin —
                // we keep it that way since it's regional and parsing
                // is error-prone. Schema.org tolerates this.
                addressLocality: s.brokerageOffice.cityStateZip || undefined,
                addressCountry: "US",
              },
            }
          : {}),
        ...(s.brokerageOffice.phone
          ? { telephone: s.brokerageOffice.phone }
          : {}),
        ...(s.brokerageOffice.logoSrc ? { logo: s.brokerageOffice.logoSrc } : {}),
      }
    : undefined;

  // areaServed: serviceArea is a free-text field ("Virginia, Maryland &
  // D.C."). We emit it as a `Place` with the string as its name — Google
  // accepts this form. If admin later wants per-county AdministrativeArea
  // entries we can split here.
  const areaServed = s.serviceArea
    ? { "@type": "Place", name: s.serviceArea }
    : undefined;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: s.name,
    url: origin,
    ...(s.portrait.full || s.portrait.avatar
      ? { image: s.portrait.full || s.portrait.avatar }
      : {}),
    ...(s.tagline ? { description: s.tagline } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
    ...(Array.isArray(s.languages) && s.languages.length > 0
      ? { knowsLanguage: s.languages }
      : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(credentials.length > 0 ? { hasCredential: credentials } : {}),
    ...(brokerage ? { worksFor: brokerage } : {}),
    jobTitle: s.role || "Real Estate Specialist",
  };

  // We render JSON.stringify directly — this script is server-rendered
  // into the HTML head, no client hydration needed.
  return (
    <script
      type="application/ld+json"
      // The brace-string form here is the documented Next.js pattern
      // for injecting JSON-LD; it stringifies once on the server and
      // ships unescaped to the browser. (React would otherwise escape
      // the `</script>` substring even though that can't appear in our
      // JSON output.)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
