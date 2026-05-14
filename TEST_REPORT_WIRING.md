# Admin ↔ Frontend Wiring Report

**Test target:** http://localhost:3009 (dev)
**Test method:** Admin UI walkthrough + Supabase direct queries + full code reads of every loader / block / footer / header / open-house page
**Roundtrips run:** 14 (each: read → write `__TEST_` value → verify on frontend → revert)
**Total wiring issues found:** 11
  - **P0** (admin field exists but frontend ignores it — fake control): **5**
  - **P1** (partial wiring — some surfaces render, some don't): **3**
  - **P2** (frontend hard-codes a value that should be admin-editable): **3**

All `__TEST_` values were reverted. Final DB scan (page_blocks, page_meta, content_blocks, site_settings, communities, reviews, closings, partners, pages, open_houses) is clean — no rows contain `__TEST_` markers.

---

## Wiring scorecard

| Admin field | Persists in DB? | Frontend renders? | Surfaces it appears on | Verdict |
|---|---|---|---|---|
| **Brand → Identity → Name** | yes (`content_blocks.brand.identity.name`) | **NO — never read** | – | **P0 FAIL** (fake control) |
| **Brand → Identity → Role** | yes | **NO — never read** | – | **P0 FAIL** (fake control) |
| **Brand → Identity → Brokerage** | yes | **NO — never read** | – | **P0 FAIL** (fake control) |
| **Brand → Identity → Tagline** | yes | **NO — never read** | – | **P0 FAIL** (fake control) |
| **Brand → Identity → Service Area** | yes | **NO — never read** | – | **P0 FAIL** (fake control) |
| **Brand → Identity → Languages** | yes | **NO — never read** | – | **P0 FAIL** (fake control) |
| Brand → Realtor Portrait | yes | yes | header avatar, footer, About page hero, home `meet_agent` block, open-house flyer, favicon fallback | PASS |
| Brand → Broker Logo | yes | yes | open-house flyer header band only (Footer uses `/images/Remax%20Galaxy.png` hard-coded) | PARTIAL P1 |
| Brand → Favicon | yes | yes | served at `/icon` (round PNG via ImageResponse). Tab icon updates. | PASS |
| Brand → Site Featured Image | yes | **partial** | only renders as `twitter:image` from root layout; per-page `generateMetadata()` strips `og:image` on all 11 fixed pages | **P0 FAIL** (per-page overrides drop the image) |
| Brand → Site Colors (theme) | yes | yes | re-skins entire site via CSS variables (header, footer, navy bands, hero stats, AND open-house flyer's navy band — globally) | PASS |
| Site Settings → Phone | yes | **partial** | Footer ✅; MenuDrawer ❌ (static `lib/site.ts`); DirectContactBlock ❌; open-house flyer ❌; `realtor-in/<county>` ❌ | **P1** |
| Site Settings → Email | yes | **partial** | same as phone — Footer ✅, MenuDrawer ❌, DirectContactBlock ❌, flyer ❌, county ❌ | **P1** |
| Site Settings → Brokerage office (name / street / city·st·zip / phone) | yes | **partial** | Footer ✅; open-house flyer ❌ (reads static `site.brokerageOffice.*`) | **P1** |
| Site Settings → Licenses (VA / MD / DC) | yes | **partial** | Footer "Licensed in VA, MD & D.C." line is HARD-CODED text, not derived from licenses; DirectContactBlock ❌ (reads `site.licenses.*`); open-house flyer ❌; About page – need to verify per-block content (likely block-data-typed, not auto-licensed) | **P1** |
| Site Settings → Instagram URL | yes | yes | footer Instagram icon href | PASS |
| Site Settings → Facebook URL | yes | yes | footer Facebook icon href | PASS |
| Site Settings → TikTok URL | yes | yes | footer TikTok icon href | PASS |
| Site Settings → YouTube URL | yes | **NO** | Footer renders only IG/FB/TikTok icons; YouTube field exists in admin/DB but no icon on frontend | **P0 FAIL** |
| Site Settings → LinkedIn URL | yes | **NO** | Same — admin field exists, no icon rendered | **P0 FAIL** |
| Site Settings → Fixed Nav (reorder / enable / relabel) | yes | yes | header drawer reflects order, hide, and relabel | PASS |
| Site Settings → Page Metadata (per-page title) | yes | yes | `<title>` on every fixed page; verified on `/about` | PASS |
| Site Settings → Page Metadata (per-page description) | yes | yes | `<meta name="description">` on every fixed page | PASS |
| Page Builder → block content (text fields) | yes | yes | verified eyebrow change on home `quote_pullquote` (pos 30) | PASS |
| Page Builder → wrapper.textColor (Light/Dark force) | yes | yes | adds `section-text-light` class; `app/globals.css` cascades white text | PASS (existing — not re-tested in detail this run) |
| Page Builder → wrapper.theme / spacing / overlay | yes | yes | `BlockShell` applies them; existing pages already use them | PASS |
| Communities → median, image, all other fields | yes | yes | grid card on `/communities`, detail page `/communities/<slug>`, AND home `community_grid` block | PASS |
| Reviews → toggle "Show on homepage" | yes | yes | `reviews_strip` on home updates immediately | PASS |
| Reviews → quote / author / rating | yes | yes | `/reviews` full list | PASS (per code read — not roundtrip-tested for time) |
| Closings → CRUD + display_order | yes | yes | home preview = first 6 by display_order; `/closings` shows all (paged with Load More) | PASS |
| Closings → image | yes | yes | grid card on home + `/closings` | PASS |
| Partners → CRUD | yes | **NO — frontend ignores DB** | `PartnersDirectoryBlock` queries `partners.category` (column doesn't exist; should be `category_id`) → block renders ZERO partner cards. The seeded `[Lender Partner Name]` placeholder, my added `__TEST` partner, and any future entries are all invisible. | **P0 FAIL** |
| Custom Pages → CRUD + published + show_in_nav | yes | yes | `/moving-to-vienna` renders; show_in_nav toggle adds nav entry | PASS |
| Open Houses → all flyer fields | yes | yes | `/open-house/<slug>` renders heading, city line, MLS, pills, photos, date pill | PASS |
| Open Houses → per-listing brand color | – | – | **NO admin field exists**; schema has no `brand_color` column. The flyer's navy band re-colors only via the GLOBAL Brand Theme (`/admin/brand/theme`) — every flyer shares one color. | See dedicated section below. |
| County Landing (`/realtor-in/<slug>`) | DB-edited via `/admin/seo` | – | currently 0 rows in `county_landing_pages`; the route renders via static `lib/site.ts` constants when no row exists | PASS (architecture-only check; no DB row yet) |
| Forms / Inbox | DB-edited via `/admin/forms` | – | currently 0 rows in `forms`; renderer exists at `/form/<slug>` (PublicFormRenderer) | not exercised — no data |
| Integrations → GA Measurement ID | DB-edited via `/admin/integrations` | yes (when set) | `app/layout.tsx` injects gtag scripts when row enabled + valid `G-XXXX` ID. Currently empty; no GA in HTML — correct. | PASS (architecture) |

Footer/Header column references:
- **Footer** — phone, email, brokerage office name/street/city·state·zip/phone, Instagram/Facebook/TikTok URLs, portrait avatar all flow through. Copyright text, REMAX Galaxy logo path, newsletter copy, "Stay in Touch" / "Newsletter" / "Quarterly market reports…" copy, "Licensed in Virginia, Maryland & D.C." line are **all HARD-CODED**.
- **Header** — logo, contact button, hamburger drawer trigger all hard-coded layout. Nav comes from settings. Portrait avatar comes from Brand → Portrait. ✅

---

## Critical wiring issues (P0/P1)

### P0-1 — Brand Identity name/role/brokerage/tagline/serviceArea/languages are fake controls

**Admin field:** `/admin/brand` → Identity → all 6 text fields
**What admin expects:** changing the name (e.g. to "Jane Doe") would update site-wide chrome (header, footer, About page, open-house flyer, page metadata).
**What actually happens:** the row is saved to `content_blocks` under `page='brand', key='identity'` — but **nothing on the public site ever reads `getBrand()` from `lib/contentLoader.ts`**. Every appearance of "Shoukoufa Aboubakri" / "Real Estate Specialist" / "REMAX Galaxy" / "Building Legacies…" comes from either:
- per-block content typed into the page builder (`page_blocks.data.*`), OR
- static `lib/site.ts` constants used by Footer, MenuDrawer, DirectContactBlock, open-house flyer, `realtor-in/[slug]/page.tsx`.
**Repro:** I inserted `{name:"__TEST_NAME"}` into `content_blocks` for `brand.identity` and verified zero occurrences of `__TEST_NAME` in the rendered HTML of `/`, `/about`, `/contact`.
**Code pointers:**
- `lib/contentLoader.ts:287` exports `getBrand()` — but `grep -r "getBrand[^L]" components app lib` returns NO callers.
- `lib/siteSettings.ts:84` hardcodes `name: staticSite.name`, `tagline: staticSite.tagline`, `brokerage: staticSite.brokerage` from `lib/site.ts`. There is no DB-merge for these three fields in `getSiteSettings()`.
- `components/Footer.tsx`, `components/MenuDrawer.tsx`, `app/open-house/[slug]/page.tsx`, `app/realtor-in/[slug]/page.tsx`, `components/blocks/SpecialBlocks.tsx (DirectContactBlock)` all import from `@/lib/site` directly.
**Recommended fix:** either (a) hide the Identity card from `/admin/brand` until wiring exists, or (b) extend `getSiteSettings()` to merge brand.identity values, and refactor Footer/MenuDrawer/DirectContactBlock/open-house/realtor-in to consume the merged `SiteSettings` object (Footer already accepts `settings` as a prop; pass it the merged name + brokerage).

### P0-2 — Partners Directory shows NO partner cards (broken column reference)

**Admin field:** `/admin/partners` — add / edit lenders, inspectors, etc.
**What admin expects:** partner cards rendered under category headings on `/partners`.
**What actually happens:** the `PartnersDirectoryBlock` (`components/blocks/SpecialBlocks.tsx:350`) queries `from("partners").select("id, category, name, role, ...")` — but the `partners` table has a column named `category_id` (FK to `partner_categories`), not `category`. Supabase returns a 42703 error, the catch silently returns `[]`, and the block renders only its heading/intro/disclaimer — no partner cards.
**Repro:** Inserting `__TEST Partner` into `partners` and visiting `/partners` shows zero partner cards (only the intro paragraph + outro CTA band).
**Code pointer:** `components/blocks/SpecialBlocks.tsx:374-378` — the SELECT statement.
**Recommended fix:** use `lib/partnersLoader.ts`'s already-correct `getPartnerCategories()` (it joins partners → partner_categories properly and resolves photo/logo URLs). Replace the inline query in `PartnersDirectoryBlock` with a call to that loader. The seeded `[Lender Partner Name]` placeholder partner + the entire `/partners` page have been silently broken.

### P0-3 — YouTube and LinkedIn URLs in Site Settings are fake controls

**Admin field:** `/admin/settings → Social → YouTube URL, LinkedIn URL`
**What admin expects:** when filled in, YouTube + LinkedIn icons appear in the footer next to Instagram / Facebook / TikTok.
**What actually happens:** the values save to `site_settings.youtube_url` / `linkedin_url`. The Footer component only renders three hard-coded icons (Instagram, Facebook, Music2 for TikTok). YouTube and LinkedIn icons are not rendered even when set.
**Repro:** Set `youtube_url='https://youtube.com/__TEST'`. No `href="https://youtube.com/__TEST"` in footer DOM.
**Code pointer:** `components/Footer.tsx:157-167` — only 3 `<a>` tags.
**Recommended fix:** add Youtube + Linkedin icons (`lucide-react`) and render them conditionally (`{site.social.youtube && <a …>}`).

### P0-4 — `og:image` is missing on all 11 fixed pages

**Admin field:** `/admin/brand → Site Featured Image`
**What admin expects:** the picked image becomes the OpenGraph image when the homepage / about / etc. is shared on Facebook, iMessage, LinkedIn.
**What actually happens:** the root `app/layout.tsx` `generateMetadata()` correctly sets `openGraph.images` and `twitter.images` to the Brand Featured Image URL. But each page (home, about, buyers, sellers, invest, communities, closings, reviews, partners, contact, privacy) defines its own `generateMetadata()` that returns `{title, description, openGraph: {title, description}}` — **without `openGraph.images`**. Next.js shallow-merges per-page metadata over layout metadata, so `og:image` gets DROPPED. (Twitter image survives because the `twitter` key isn't overridden by the pages.)
**Repro:** Inspect `<head>` of `/` and `/about` — `og:title` and `og:description` are present, but `og:image` is absent. `twitter:image` correctly points to the Unsplash fallback.
**Code pointers:** `app/page.tsx:7-18`, `app/about/page.tsx`, and 9 more.
**Recommended fix:** in each per-page `generateMetadata()`, add `openGraph.images: [{ url: await getFeaturedImage() }]` (or — better — extract the layout's `openGraph.images` and re-include it; or in `getPageMeta()` always return both title+description+image and have a single helper assemble Metadata correctly).

### P0-5 — Open House flyer ignores admin Site Settings for contact + brokerage info

**Admin field:** Site Settings → phone / email / brokerage office name / street / city·state·zip / phone / VA license number.
**What admin expects:** the open-house flyer's footer (realtor card + brokerage card) reflects whatever admin sets in Site Settings.
**What actually happens:** `app/open-house/[slug]/page.tsx:341,350,356,360,364,367,371,402,419,422,424,427,430` imports `{ site }` from `@/lib/site` and pulls `site.name`, `site.licenses.va`, `site.phone`, `site.phoneHref`, `site.email`, `site.emailHref`, `site.brokerageOffice.name`, `site.brokerageOffice.street`, `site.brokerageOffice.cityStateZip`, `site.brokerageOffice.phone`, `site.brokerageOffice.phoneHref` — all from the STATIC `lib/site.ts` constants, NOT from the admin-edited `site_settings` table. Same for the MLS-section's brokerage logo (`/images/Remax%20Galaxy.png` is hard-coded).
**Recommended fix:** replace the static `{ site }` imports in `open-house/[slug]/page.tsx` with a call to `getSiteSettings()` (already exists in `lib/siteSettings.ts`) and read the same fields off the returned object. Also use `getBrokerLogo()` (already exists) for the listing-brokerage row at the bottom of the flyer.

### P1-1 — DirectContactBlock ignores Site Settings

**Admin field:** Site Settings → phone, email, licenses.
**Actual:** `components/blocks/SpecialBlocks.tsx:488-499` (`DirectContactBlock`) reads `site.phoneHref`, `site.phone`, `site.emailHref`, `site.email`, `site.licenses.md`, `site.licenses.dc` from the STATIC `lib/site.ts` — bypassing the DB Site Settings.
**Surfaces affected:** the "Direct Contact" block used on `/contact`. If Umair changes phone via admin, footer updates but the prominent contact block on the contact page does NOT.
**Recommended fix:** make `DirectContactBlock` either a server component that calls `getSiteSettings()` itself, OR accept the settings via prop passed down from `PageRenderer`.

### P1-2 — MenuDrawer (hamburger contact section) ignores Site Settings

**Admin field:** Site Settings → phone, email.
**Actual:** `components/MenuDrawer.tsx:150-155` shows `site.phoneHref`, `site.phone`, `site.emailHref`, `site.email` from the STATIC `lib/site.ts`. The MenuDrawer already accepts `portraitAvatar` as a prop — extend it to take phone/email.
**Recommended fix:** Pass phone + email from layout (which has `settings`) to `MenuDrawer` via a new prop. Update Header → MenuDrawer to forward.

### P1-3 — County Landing (`/realtor-in/<slug>`) ignores Site Settings

**Admin field:** Site Settings → phone, email.
**Actual:** `app/realtor-in/[slug]/page.tsx:115,116,295,297,299` reads from static `site.phone` / `site.email`.
**Recommended fix:** replace with `getSiteSettings()` reads.

---

## Hard-coded values that should be admin-editable (P2)

### P2-1 — Footer "Licensed in Virginia, Maryland & D.C." subtitle (hard-coded)
`components/Footer.tsx:67-72`. The license states are derived as an inline literal, not from `site.licenses` keys. If an admin removes the D.C. license in Site Settings → leaving only VA/MD valid — the footer still says "Licensed in Virginia, Maryland & D.C." Recommended: derive the list of states dynamically from non-empty `settings.licenses.{va,md,dc}` keys.

### P2-2 — Footer copyright line / Brand Bonjour credit / newsletter copy / "Stay in Touch" headline (hard-coded)
`components/Footer.tsx:65,71,131-141,179-180,217-218`. The footer is a wall of editorial copy that today only a developer can change. If Umair wants to rename "Brand Bonjour" credit, remove the newsletter, change the copy, or update the copyright line, code is required. Suggested admin surface: a "Footer Copy" block in `/admin/settings` (or a dedicated `Site Footer` section in `/admin/brand`).

### P2-3 — Footer & Header's REMAX Galaxy logo path is hard-coded
`components/Footer.tsx:119` and `app/open-house/[slug]/page.tsx` both use `/images/Remax%20Galaxy.png` directly. The Brand → Broker Image admin field exists and is reachable via `getBrokerLogo()` — but Footer doesn't call it (only the open-house flyer header band does). Recommended: Footer should call `getBrokerLogo()` via prop or server-side resolution, the same way it resolves `portraitAvatar`.

### P2-4 — Hero stats fallback (`heroStats` in `lib/site.ts`)
Per the WIRING.md doc this is intentional "last-resort fallback" and the actual stats live on the Hero block. Verified — home hero block carries its own `stats` array. ✅ (mentioning for completeness; not an admin issue.)

---

## Open House flyer color investigation

**What Umair asked:** *"When a landing page is created, does the flyer have the color set from the admin panel?"*

**Current state:**

1. **No per-listing color override exists.** `open_houses` table schema (migrations `0006_open_houses.sql` → `0008_open_house_address_and_day2.sql`) has no `brand_color` / `primary_color` / `theme_override` column. The admin form (`components/admin/openhouse/OpenHouseForm` referenced from `app/admin/open-houses/[slug]/page.tsx`) has no color picker. So an admin **cannot** set "use a maroon header band on THIS flyer."

2. **The global Brand Theme DOES re-color the flyer.** The Open House page uses Tailwind `bg-navy` and `text-white` for the header band and footer band. `bg-navy` is wired to `var(--brand-primary)` via `tailwind.config.ts`, and `<BrandThemeStyle />` in `app/layout.tsx` overrides that CSS variable from `content_blocks.brand.theme.primary`. I verified by setting brand theme primary to `#C2185B` and confirming the CSS variable is injected on `/open-house/<slug>`. So changing Site Colors at `/admin/brand/theme` re-skins every flyer.

3. **What's hard-coded inside the flyer (cannot be edited at all today):**
   - The "Listing brokerage" label, "Real Estate Specialist · VA Lic # …" line, MLS/realtor emblems, Equal Housing logo, etc. — all literal copy in `app/open-house/[slug]/page.tsx`.
   - All brokerage / realtor contact info reads from static `lib/site.ts` (P0-5 above).
   - The brokerage logo in the listing-brokerage section uses the broker image from `getBrokerLogo()` — that one IS wired. ✅

**Recommended fix order:**

**A. If per-listing color is the goal:**
1. Add migration: `ALTER TABLE open_houses ADD COLUMN brand_color text` (nullable; null = "use global Brand Theme").
2. Add a color picker to the Open House admin form (HTML5 `<input type="color">`).
3. In `app/open-house/[slug]/page.tsx`, if `oh.brand_color` is set, inject an inline `<style>` scoped to `.flyer { --brand-primary-rgb: …; }` (compute from the hex with `hexToRgbTriplet`). Otherwise fall back to the global Brand Theme.
4. Confirm contrast — the flyer uses white text on the band, so admin must be warned if they pick a light color.

**B. Before doing (A), fix P0-5 (open-house ignores Site Settings).** Otherwise admin will change brokerage phone in Site Settings and the flyer will still show the static `lib/site.ts` value.

---

## Architectural observations

1. **Two parallel "brand" systems exist and they don't agree.** `lib/contentLoader.ts → getBrand()` reads `content_blocks.brand.identity`, but `lib/siteSettings.ts → getSiteSettings()` reads from `site_settings` AND merges with `staticSite` defaults — without ever consulting `content_blocks.brand.identity`. So the Brand Identity admin section is essentially orphaned for text fields, while the Site Settings admin handles a subset (phone/email/social/nav). The 6 brand-image fields (portrait, brokerLogo, favicon, featuredImage) work because they have their own resolvers (`getPortrait`, `getBrokerLogo`, `getFavicon`, `getFeaturedImage`) that ARE called by consumers.

2. **Footer is wired correctly via the props path; everything else uses the static import.** `app/layout.tsx` does `getSiteSettings()` and passes `settings` to `<Footer>` as a prop. Footer respects it. But MenuDrawer, DirectContactBlock, open-house, and realtor-in all import `{ site }` directly from `@/lib/site` — they pre-date the Site Settings work and were never refactored. A simple fix is to thread `settings` via `Header → MenuDrawer`, make DirectContactBlock async (server component) and have it call `getSiteSettings()` itself, and replace the static imports in open-house and realtor-in.

3. **Per-page `generateMetadata()` strips `openGraph.images`.** When a per-page metadata override returns `openGraph: { title, description }` without `images`, Next.js drops the layout's images. This affects every fixed page and is the single reason `og:image` is missing site-wide. The fix is small: in each page's generateMetadata, either spread the layout's `openGraph` or call `getFeaturedImage()` again.

4. **`PartnersDirectoryBlock` is the only special block that re-implements its own DB query instead of reusing the loader.** Every other special block (`community_grid`, `closings_grid`, `reviews_strip`, `reviews_full`) calls its dedicated loader. The partners block inlines a Supabase query that doesn't match the schema. Refactor to use `getPartnerCategories()` from `lib/partnersLoader.ts`.

5. **Wrapper-level controls (theme/spacing/overlay/textColor) are universally honored.** Every block that flows through `BlockShell` picks them up. `HeroBlock` and `CtaBandBlock` apply the textColor class directly per the doc note. ✅

6. **Brand Theme color cascade is excellent.** Single CSS variable swap re-skins the whole site including the open-house flyer's navy bands. The Brand Theme is the most cohesively-wired admin field in the project.

7. **`content_blocks.brand` table is currently empty.** No brand admin form has ever been saved in this DB. The Brand admin screens are reachable and functional, but until an admin saves a row, the site uses 100% defaults — meaning right now, the only way to change "Shoukoufa Aboubakri" anywhere on the site is to edit `lib/site.ts` in code, or edit each `page_blocks` row that types her name manually. **This is the single biggest perceived gap for a non-technical client.**

8. **Open Houses table has no color/theme/branding column.** Adding per-listing color override is a small migration + admin field + page-level style injection. Not blocking; just not wired.
