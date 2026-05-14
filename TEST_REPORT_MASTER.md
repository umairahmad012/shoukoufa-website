# Master Test Report — Shoukoufa Aboubakri Website

**Date:** 2026-05-14
**Test target:** http://localhost:3009 (dev)
**Viewports tested:** Laptop 1440×900, iPad 820×1180, Phone 390×844
**Agents involved:** 4 (1 responsive-fix + 3 read-only auditors)

This report consolidates findings from four specialized agent runs. The full source reports are kept alongside this document:

- `RESPONSIVE_FIXES.md` — what the responsive-fix agent changed (already applied to the codebase)
- `TEST_REPORT_FRONTEND.md` — public-site UX audit (read-only)
- `TEST_REPORT_ADMIN.md` — admin-panel audit (read-only)
- `TEST_REPORT_WIRING.md` — admin ↔ frontend wiring audit (round-trip-tested with DB writes + cleanup)

---

## Headline

The site is **shippable today** — no blocking bugs, no broken links, no security or auth issues, no Samina ghosts. The admin panel is comprehensive and most features are wired correctly. But there are **5 P0 wiring failures** where admin fields exist but do nothing on the public site, and **1 P0 functional regression** (Partners Directory shows zero cards due to a wrong column reference). Those should be fixed before the next non-trivial round of content edits.

| Severity | Count | Source |
|---|---|---|
| **P0** (blocking / broken) | **6** | 0 from Frontend, 0 from Admin, 5 from Wiring, 1 from regression in Partners |
| **P1** (visible bug) | 12 | 6 from Frontend, 3 from Admin, 3 from Wiring |
| **P2** (polish) | 22 | 8 from Frontend, 11 from Admin, 3 from Wiring |
| **Total** | **40** | |

Plus **8 layout fixes already applied** by the responsive-fix agent (committed to local state, not yet deployed).

---

## P0 — Must fix before next deploy

### P0-1 — Partners Directory shows zero cards on `/partners` (broken right now in prod)

**Source:** Wiring report
**Impact:** The entire `/partners` page renders with the intro heading and disclaimer but **zero partner cards** even though 13 partners are seeded in the DB.
**Root cause:** `components/blocks/SpecialBlocks.tsx` line ~374 — `PartnersDirectoryBlock` runs an inline Supabase query against `partners.category`, but the actual column is `partners.category_id` (FK to `partner_categories`). Supabase returns a 42703 error, the catch silently swallows it, the block renders empty.
**Fix:** Replace the inline query with a call to `getPartnerCategories()` from `lib/partnersLoader.ts` (which already exists and joins correctly). Every other special block (community_grid, closings_grid, reviews_strip) follows this pattern — `PartnersDirectoryBlock` is the lone exception.

### P0-2 — Brand Identity name / role / brokerage / tagline / service area / languages are fake controls

**Source:** Wiring report
**Impact:** All six text fields under `/admin/brand → Identity` save to the DB but **nothing on the public site ever reads them**. Every appearance of "Shoukoufa Aboubakri" / "Real Estate Specialist" / "REMAX Galaxy" / "Building Legacies, One House at a Time" comes from either page-builder block content typed into specific pages OR the static `lib/site.ts` constants.
**Repro:** Wiring agent wrote `__TEST_NAME` to `content_blocks.brand.identity` and confirmed zero `__TEST_NAME` occurrences anywhere on the rendered site.
**Code pointers:**
- `lib/contentLoader.ts:287` — exports `getBrand()` but `grep` shows NO callers in `components/`, `app/`, or `lib/`.
- `lib/siteSettings.ts:84` — hard-codes `name`, `tagline`, `brokerage` from `staticSite` rather than merging from `content_blocks.brand.identity`.
- `components/Footer.tsx`, `components/MenuDrawer.tsx`, `app/open-house/[slug]/page.tsx`, `app/realtor-in/[slug]/page.tsx`, `DirectContactBlock` all import `{ site }` from `@/lib/site` directly.

**Fix options:**
- **(a) Hide the Identity card** from `/admin/brand` until wiring exists. Fastest, no architectural change. The realtor name etc. would still only be editable per-block via the page builder.
- **(b) Wire it properly:** extend `getSiteSettings()` to merge `content_blocks.brand.identity` values, then refactor Footer, MenuDrawer, DirectContactBlock, open-house and realtor-in pages to consume the merged settings. Bigger change, but it's the architecturally correct fix.

Recommend (b) — it removes a real footgun for the realtor.

### P0-3 — YouTube and LinkedIn URL fields in Site Settings are fake controls

**Source:** Wiring report
**Impact:** `/admin/settings → Social → YouTube URL` and `LinkedIn URL` save to DB but the footer only renders Instagram / Facebook / TikTok icons. Setting these URLs is a no-op visually.
**Fix:** Add `Youtube` and `Linkedin` icons (from `lucide-react`) to `components/Footer.tsx` rendered conditionally on `settings.social.youtube` and `settings.social.linkedin`.

### P0-4 — `og:image` is missing on all 11 fixed pages

**Source:** Wiring report
**Impact:** When the home / about / buyers / sellers / invest / communities / closings / reviews / partners / contact / privacy page is shared on Facebook, iMessage, LinkedIn — no preview image renders. Twitter image survives (different metadata key not overridden).
**Root cause:** Each per-page `generateMetadata()` returns `{ title, description, openGraph: { title, description } }` **without `openGraph.images`**. Next.js shallow-merges per-page metadata over layout metadata, so the layout's `og:image` gets dropped.
**Fix:** In each page's `generateMetadata()`, add `openGraph.images: [{ url: await getFeaturedImage() }]`. Or — cleaner — extract the layout's `openGraph.images` and re-include it, OR have `getPageMeta()` always return both title + description + image and have a single helper assemble the Metadata correctly.

### P0-5 — Open House flyer ignores admin Site Settings for contact + brokerage info

**Source:** Wiring report
**Impact:** When an admin changes phone, email, brokerage office address, or VA license number via `/admin/settings`, the open-house flyer at `/open-house/<slug>` **does not pick up the change**. It reads from static `lib/site.ts` constants. Same for the brokerage logo (`/images/Remax%20Galaxy.png` hard-coded).
**Code pointer:** `app/open-house/[slug]/page.tsx:341,350,356,360,364,367,371,402,419,422,424,427,430`
**Fix:** Replace `import { site } from "@/lib/site"` with `const settings = await getSiteSettings()` and read fields off `settings`. Use `getBrokerLogo()` for the brokerage logo.

### P0-6 — Two `bg-cream-soft` sections back-to-back on `/` (rhythm rule violation)

**Source:** Frontend report (P1-5)
**Severity bumped to P0 because:** it's the only section-rhythm violation across the whole site and the rhythm rule is documented in WIRING.md §3.5 as a design contract.
**Impact:** Home page sections 4 and 5 (Three Ways I Help + Communities grid) both render `bg-cream-soft`. They flow into one continuous cream block with no visible separator.
**Fix:** Either change one of the two to navy / transparent, OR insert a DarkBreak or text block between them. The home page already has a DarkBreak before "Why I Do This Work" — could re-use that pattern.

---

## P1 — Visible bugs worth fixing in the next pass

### Frontend (typography clipping)

- **P1-1: Header wordmark clips on iPad** — `whitespace-nowrap` + `md:tracking-[0.42em]` on the subline "Real Estate Specialist" overflows ~21px at 820px viewport. Responsive agent partly fixed this for phone but the iPad case remains. **Recommend:** drop the subline at the `md:` breakpoint and below, OR tighten subline tracking to ~0.22em at md.

- **P1-2: Home services-card CTAs clip at laptop** — "BUYING WITH SHOUKOUFA ↗" (249px) and "SELLING WITH SHOUKOUFA ↗" (255px) overflow their 219px container at every viewport. **Recommend:** rename to "Start buying" / "Start selling", or reduce tracking from 0.32em to 0.22em. Source: `components/PillarCards.tsx` line 83. **Note:** PillarCards may be legacy — verify the home actually uses it vs the page-builder Three Cards block.

- **P1-3: Community card H3 names clip on iPad** — "ALEXANDRIA" (~68px clipped) and "ARLINGTON" (~48px clipped). `md:text-4xl` (36px) is too big for ~187px card width at iPad. **Recommend:** use `text-3xl` at md, `text-4xl` at lg.

- **P1-4: Community card "MEDIAN" stat label clips ~5px on iPad** — 0.28em tracking too wide for the column. **Recommend:** drop md tracking to 0.22em, OR shrink font to `md:text-[0.55rem]`.

- **P1-6: Privacy page references license numbers in the footer that the footer doesn't show** — "License numbers are listed in the site footer and on the About page" is a half-truth. Footer just says "Licensed in VA, MD & DC". **Recommend:** either show the three numbers in the footer (under Brokerage Office), OR change the privacy copy to "...on the About page" only.

### Admin (UX nits)

- **P1-A1: `/admin/closings` says "Reorder with the arrows on each card"** — no arrows actually exist. Either add them or drop the sentence.
- **P1-A2: `/admin/integrations` bare path 404s into the public site's "PAGE NOT FOUND" / "EXPLORE COMMUNITIES" page** — should redirect to `/admin/integrations/google` or render an admin-scoped 404.
- **P1-A3: Block Delete uses native `window.confirm()`** — works but unstyled, breaks the admin's visual language.

### Wiring (partial wiring — some surfaces work, some don't)

- **P1-W1: DirectContactBlock ignores Site Settings** (phone/email/licenses come from `lib/site.ts`)
- **P1-W2: MenuDrawer (hamburger contact section) ignores Site Settings**
- **P1-W3: County landing pages (`/realtor-in/<slug>`) ignore Site Settings**

All three follow the same pattern: components written before `getSiteSettings()` existed, never refactored to consume it. Single-line replacement of static imports with `const settings = await getSiteSettings()` in each.

---

## P2 — Polish (worth doing eventually)

### Tap targets < 44px on phone (8 violations, all in footer or forms)

| Element | Size | Fix |
|---|---|---|
| Footer phone link | 120×20 | `py-2.5` or `min-h-[44px]` |
| Footer email link | 249×20 | Same |
| Footer brokerage phone | 100×17 | Same |
| Footer social icons (×3) | 22×22 | `p-3 -m-3` hit padding |
| Footer Privacy link | 164×16 | `py-2 inline-block` |
| Contact form consent checkbox | 13×13 | `w-5 h-5` |
| Leave-review star buttons (×5) | 28×28 | `p-2 -m-2` |
| Logo link on phone | 306×36 | `min-h-[44px]` |
| Admin block control buttons | 32×32 | bump padding |

**Pattern fix:** the footer pattern repeats on every page. Fixing the global Footer component once resolves ~60% of these.

### Admin polish (11 items, mostly accessibility)

- Icon-only buttons rely on `title=` not `aria-label`
- Image picker not a proper `role="dialog"`, no Escape-to-close, no focus trap
- Add Block modal has no ARIA role
- "Coming soon" features (analytics, most SEO tiles) live in sidebar without a beta tag
- `/admin/brand` hub repeats "TAP TO MANAGE / TAP TO OPEN / OPEN" three times per card
- Disabled Move up/Down buttons show `cursor: default` not `not-allowed`
- Review edit checkboxes missing `id` / `for=` linkage
- Inbox empty state shows "0 / 0 / 0 / 0" filter row before "No leads"
- Inline-everywhere editing pushes content far down on phone (consider drawer pattern)

### Footer / header polish (3 items)

- Footer copyright / Brand Bonjour credit / newsletter copy is hard-coded — could be admin-editable
- Footer REMAX Galaxy logo path is `/images/Remax%20Galaxy.png` literal — should call `getBrokerLogo()`
- Footer brokerage phone unlabeled — could add "Office:" prefix

---

## Open House flyer color (the one Umair explicitly asked about)

**Current state:** No per-listing color override exists. The `open_houses` table has no `brand_color` column, the admin form has no color picker. But the **global Brand Theme primary color** (`/admin/brand/theme`) does re-skin the flyer's navy bands via CSS variable cascade — confirmed by setting brand theme primary to `#C2185B` and seeing the variable inject on the flyer page.

**If per-listing color is the goal:**

1. Migration: `ALTER TABLE open_houses ADD COLUMN brand_color text` (nullable; null = use global theme)
2. Admin: add HTML5 `<input type="color">` to the Open House form
3. Page: if `oh.brand_color` is set, inject a scoped `<style>` overriding `--brand-primary-rgb` (compute from hex with the existing `hexToRgbTriplet` helper). Else fall back to global theme.
4. Warn admin about contrast when picking a light color (flyer uses white text on the band).

**Before doing this, fix P0-5 (open-house ignores Site Settings).** Otherwise the rest of the flyer will still pull from `lib/site.ts`.

---

## Architectural observations (from the wiring agent)

1. **Two parallel "brand" systems exist and don't agree.** `getBrand()` reads `content_blocks.brand.identity`; `getSiteSettings()` reads `site_settings` AND merges with `staticSite` — without ever consulting `content_blocks.brand.identity`. So the Brand Identity admin section is orphaned for its 6 text fields, while Site Settings handles a different subset. The 6 brand-image fields (portrait, brokerLogo, favicon, featuredImage) work because they have their own resolvers (`getPortrait`, `getBrokerLogo`, `getFavicon`, `getFeaturedImage`) that ARE called by consumers.

2. **Footer is wired via props; everything else uses static import.** `app/layout.tsx` does `getSiteSettings()` and passes `settings` to `<Footer>` as a prop. Footer respects it. But MenuDrawer, DirectContactBlock, open-house and realtor-in all import `{ site }` directly from `@/lib/site` — they pre-date the Site Settings work.

3. **Per-page `generateMetadata()` strips `openGraph.images` site-wide.** Single root cause for the missing og:image on all 11 fixed pages.

4. **`PartnersDirectoryBlock` is the only special block that re-implements its own DB query.** Every other special block calls its dedicated loader. Refactor to `getPartnerCategories()`.

5. **Wrapper-level controls (theme/spacing/overlay/textColor) are universally honored.** Every block that flows through `BlockShell` picks them up. `HeroBlock` and `CtaBandBlock` apply textColor directly per the design note. ✅

6. **Brand Theme color cascade is excellent.** Single CSS variable swap re-skins the whole site including the open-house flyer. This is the most cohesively-wired admin field.

7. **`content_blocks.brand` table is currently empty** — no Brand admin form has been saved. The site uses 100% defaults. The only way to change "Shoukoufa Aboubakri" anywhere is per-block in the page builder, OR in `lib/site.ts` code. **This is the single biggest perceived gap for a non-technical client.**

---

## Already applied (responsive-fix agent, not yet committed)

1. Header logo overflow on phone — wordmark scaled down + tighter tracking + `flex-shrink-0` on avatar
2. Three Cards / Practice Areas grid cramped on iPad — `md:grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
3. Community-detail price tiers + related grid cramped on iPad — same pattern fix
4. Community-detail hero h1 floor too high — `clamp(3rem, …)` → `clamp(2.25rem, …)` + `break-words`
5. Community-detail 4-stat strip divider direction wrong on phone — rewrote `Stat` to compute from `pos` index
6. Hero block titles could overflow on phone — clamp floor raised + `whitespace-normal sm:whitespace-nowrap break-words`
7. PageHero excessive top padding on phone — `pt-48 pb-32` → `pt-36 pb-24 sm:pt-44 sm:pb-28 md:pt-56 md:pb-40`
8. ClosingsGalleryClient double-padded (its own `gutter-x` + BlockShell's `gutter-x`) — removed inner padding

Files touched: `components/Logo.tsx`, `components/Header.tsx`, `components/PageHero.tsx`, `components/ClosingsGalleryClient.tsx`, `components/blocks/HeroBlock.tsx`, `components/blocks/ContentBlocks.tsx`, `app/communities/[slug]/page.tsx`. Build clean.

---

## Recommended action ordering

**Now (this commit, ~30-60 min):**
- P0-1 Partners directory query fix (3 lines, broken-in-prod)
- P0-3 Add Youtube + Linkedin footer icons (5 lines)
- P0-4 Add `og:image` to per-page metadata (one helper, 11 call sites — or one root-level fix)
- P0-6 Fix home rhythm: change one of the two cream-back-to-back sections
- P1-6 Add license numbers to footer (matches what the privacy page promises)

**Next week (architectural, ~2-4 hours):**
- P0-2 Wire Brand Identity → consume in Footer / MenuDrawer / DirectContactBlock / open-house / realtor-in
- P0-5 Open-house flyer reads from `getSiteSettings()` instead of `lib/site.ts`
- P1-W1/W2/W3 Same refactor cleans up DirectContact / MenuDrawer / realtor-in

**Polish backlog (whenever):**
- Tap target normalization (mostly global footer fix)
- Admin accessibility cleanup (aria-labels, role="dialog", focus trap)
- Beta-tag the half-implemented sidebar items
- Footer copy becomes admin-editable

**Future feature:**
- Per-listing open-house color override (small migration + color picker)

---

## Cleanup confirmed

The wiring agent's test data was fully reverted. Final DB scan across `page_blocks`, `page_meta`, `content_blocks`, `site_settings`, `communities`, `reviews`, `closings`, `partners`, `pages`, `open_houses` reports zero rows with `__TEST_` markers. Database is clean.
