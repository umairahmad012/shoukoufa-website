# Front-to-Back Wiring

> Living reference for how every page on **shoukoufahomes.com** is composed, where
> its data lives, and which admin screen edits each piece. If you're trying to
> figure out "where do I change X?", start here.

Last refreshed: 2026-05-14 (Site Settings + dynamic metadata + Privacy in builder) · Owner: Umair @ Brand Bonjour

---

## 1. The 30-second mental model

```
┌──────────────────────────────────────────────────────────────────────┐
│                            PUBLIC SITE                               │
│  app/<route>/page.tsx   →   <PageRenderer pageKey="…" />             │
└──────────────────────────────────────┬───────────────────────────────┘
                                       │
                                       ▼
                        lib/pageBlocks.ts  getPageBlocks()
                                       │
                                       ▼
                 ┌──────────────────────────────────────┐
                 │  Supabase  ·  page_blocks            │
                 │  (rows ordered by `position`)        │
                 │  - one row = one section on the page │
                 │  - block_type chooses the component  │
                 │  - data (jsonb) holds the content    │
                 │  - data.wrapper holds bg/video/style │
                 └──────────────────────────────────────┘
                                       │
                                       ▼
                  components/blocks/PageRenderer.tsx
                  → routes block_type → React component
                  → each block wraps in <BlockShell> for
                    background image / YouTube video /
                    overlay / theme / spacing
```

Most pages now follow this exact pattern. A few legacy / utility routes (`/privacy`,
`/open-house/[slug]`, `/leave-review`, `/realtor-in/[slug]`, `/form/[slug]`) are
hand-coded React and skip the page-builder system on purpose — they're listed in
§7.

The admin uses the same primitives in reverse: a Next.js client component
(`BuilderClient`) reads the same `page_blocks` rows, lets the user reorder /
toggle / add / delete / edit, and writes back through server actions in
`app/admin/builder/[page]/actions.ts`.

---

## 2. Architecture layers

| Layer | Lives in | What it does |
|---|---|---|
| **Public routes** | `app/<route>/page.tsx` | Minimal — almost every page is just `<PageRenderer pageKey="…" />` |
| **Renderer** | `components/blocks/PageRenderer.tsx` | Fetches ordered blocks, routes block_type → block component |
| **Block components** | `components/blocks/*.tsx` | One React component per block type (24 in total) |
| **Block shell** | `components/blocks/BlockShell.tsx` | Universal wrapper: background image / YouTube video / overlay / spacing / theme |
| **Block registry** | `lib/blockRegistry.ts` | Type catalog. Schema (`dataShape`) drives the auto-form. `defaultData()` powers "Add Block". |
| **Page-blocks loader** | `lib/pageBlocks.ts` | Reads `page_blocks` for a slug, ordered, optional include-disabled |
| **Custom pages loader** | `lib/customPages.ts` | Reads `pages` table; defines reserved slugs + slug validator |
| **Database** | Supabase project `vaizayiedkuktodsdaxa` | All content, layouts, custom pages, media references, reviews, partners, etc. |
| **Admin shell** | `components/admin/AdminShell.tsx` + `AdminSidebar.tsx` | Authenticated wrapper + sidebar nav. Gated by Supabase auth + `team_members` table. |
| **Page builder UI** | `app/admin/builder/[page]/` + `components/admin/builder/BuilderClient.tsx` | List · reorder · toggle · edit · duplicate · delete · add-block-from-library |
| **Server actions** | `app/admin/builder/[page]/actions.ts`, `app/admin/pages/actions.ts`, etc. | Authenticated mutations against Supabase |
| **Brand Identity** | `app/admin/brand/` + `lib/site.ts` defaults | Brand-wide values (name, role, brokerage, tagline, portrait, broker logo, favicon, share image) |
| **Site Settings** | `app/admin/settings/` + `lib/siteSettings.ts` | Phone, email, social URLs, licenses, brokerage office, fixed-nav order, per-page metadata (title / description) |
| **Specialized admins** | `/admin/communities`, `/admin/reviews`, `/admin/closings`, `/admin/partners`, `/admin/open-houses`, `/admin/forms`, `/admin/seo`, `/admin/media`, `/admin/integrations` | Each owns its own table; special blocks pull from these |
| **Cloudinary** | `lib/cloudinary.ts`, `lib/cloudinaryAdmin.ts` | Image delivery URLs (q_auto:best, dpr_auto, etc.) + admin storage tracking. Preset: `shoukoufa-uploads` → folder `shoukoufa-website/` |

---

## 3. Database schema — every table that backs the site

| Table | Purpose | Edited from |
|---|---|---|
| `page_blocks` | One row per section instance on any page. `page_key` + `block_type` + `position` + `data` (jsonb) | **Admin → Page Builder** |
| `pages` | Admin-created custom pages (slug, title, description, published, show_in_nav, nav_order) | **Admin → Custom Pages** |
| `site_settings` | Singleton row: phone, email, social URLs, licenses, brokerage office, fixed-nav config | **Admin → Site Settings** |
| `page_meta` | Per-page title + meta description for fixed routes (home/about/buyers/.../privacy) | **Admin → Site Settings → Page Metadata** |
| `content_blocks` | Brand Identity values only now (portrait, broker logo, favicon, share image, name, role, brokerage, tagline). Was the original section-content store before page-builder. | **Admin → Brand Identity** |
| `content_history` | Versioned history of content_blocks edits (30-day rollback) | Auto-written by save actions |
| `media` | Uploaded image + YouTube video records (Cloudinary public_id, alt, kind) | **Admin → Media Library** |
| `reviews` | Testimonials (source, author, quote, rating, featured-on-homepage) | **Admin → Reviews** |
| `review_submissions` | Pending review form submissions before approval | **Admin → Reviews** (Pending tab) |
| `communities` | 6 neighborhood records (slug, name, tagline, market data, schools, etc.) | **Admin → Communities** |
| `closings` | Sold properties grid | **Admin → Recent Closings** |
| `open_houses` | Open house listings + flyer data | **Admin → Open Houses** |
| `partners` | Lenders / inspectors / insurance / trades directory | **Admin → Trusted Partners** |
| `partner_categories` | Grouping for partners | **Admin → Trusted Partners** |
| `forms` | Custom forms (slug, fields, notify email) | **Admin → Forms** |
| `leads` | Form submission inbox | **Admin → Inbox** |
| `county_landing_pages` | SEO landing pages at `/realtor-in/<slug>` | **Admin → SEO → Counties** |
| `integrations` | Google Analytics ID, Google Reviews integration, etc. | **Admin → Integrations** |
| `team_members` | Admin users (mirrors `auth.users`) with `role` (owner / editor) | **Admin → Team** (manual SQL for now) |
| `auth.users` | Supabase auth | Created via `/admin/signup` (one-time) or service-role API |

---

## 3.5 Section rhythm rule — three background types, never the same kind back-to-back

Every section on every page falls into one of four buckets. The rule
is: **never put two sections of the same background type directly next
to each other.** Text sections are the connective tissue and can sit
anywhere; the three "background" types must not repeat adjacent.

### The four buckets

| Symbol | Bucket | What it is | Block types |
|---|---|---|---|
| **🟦 P1** | **Photo Primary background** | Full-bleed photo or YouTube video fills the entire section wrapper. The strongest visual moment a page can have. | `hero`, `dark_break`, any block whose `wrapper.backgroundImage` or `wrapper.backgroundYouTubeUrl` is set (e.g. an Invest CTA with a wrapper photo) |
| **🟧 P2** | **Photo Background** | Section wrapper is plain (cream/white) but contains photo-bearing **cards / containers**. Photos read smaller, framed inside the layout. | `three_cards` (when cards have `card.image`), `community_grid`, `closings_grid` |
| **🟫 S** | **Secondary background** | Solid colored band (no photo), visually distinct from cream/white. Carries weight without imagery. | `cta_band` with default `theme: navy`, or any other block themed dark; future band-style blocks |
| **⬜ T** | **Plain (text)** | Cream or white wrapper. No photo content. Glass-light cards with text only count as plain. Connective tissue between bg sections. | `meet_agent`, `paragraph_block`, `bullet_list`, `quote_pullquote`, `stats_strip`, `process_steps`, `faq`, `practice_areas` (numbered, no photos), `reviews_strip`/`reviews_full` (glass cards, no photos), `partners_directory` (glass cards, no photos), `valuation_form`, `contact_form`, `direct_contact`, `video_embed`, `bottom_signoff`, plus `cta_band` with `theme: cream` or `theme: white` |

### The rule

```
1. The three BACKGROUND buckets (P1 / P2 / S) can appear in ANY order.
2. NEVER place two sections of the SAME background bucket back-to-back.
   • P1 followed directly by P1  →  forbidden
   • P2 followed directly by P2  →  forbidden
   • S  followed directly by S   →  forbidden
3. Text sections (T) are not a "background" — they can sit anywhere and
   repeat freely. They're the bridge between mismatched-or-matched bg
   sections.
4. Allowed cross-bucket adjacencies (any direction):
   • P1 ↔ P2,  P1 ↔ S,  P2 ↔ S
5. Corollary: if a block has photo-bearing cards (P2), its WRAPPER
   must be plain — never paint two photo layers on one section.
```

### Worked example — homepage

| pos | block | bucket |
|---:|---|---|
| 10 | hero | **🟦 P1** |
| 20 | meet_agent | ⬜ T |
| 30 | quote_pullquote ("What clients say most") | ⬜ T |
| 40 | three_cards (Buying / Selling / Invest) | **🟧 P2** |
| 45 | quote_pullquote ("Why I'm in this work") | ⬜ T |
| 50 | community_grid (six neighborhoods) | **🟧 P2** |
| 60 | cta_band Invest teaser (navy) | **🟫 S** |
| 70 | cta_band Closings teaser (cream theme) | ⬜ T |
| 80 | dark_break ("Why I do this work") | **🟦 P1** |
| 90 | reviews_strip (glass-light cards) | ⬜ T |
| 100 | bottom_signoff | ⬜ T |

Adjacencies: P1↔T, T↔T, T↔P2, P2↔T, T↔P2, P2↔S, S↔T, T↔P1, P1↔T, T↔T.
No same-bucket pair touches. ✅

### When you add a new block via the admin

The admin doesn't enforce this — it's design discipline. The Page
Builder shows section types in a list; eyeball them top-to-bottom and
check that no two 🟦/🟦, 🟧/🟧, or 🟫/🟫 sit next to each other.

If you spot a same-bucket adjacency, you have three easy fixes:
1. **Swap one to a different bucket** — e.g. flip a `cta_band` from
   `theme: navy` (S) to `theme: cream` (T), or drop the wrapper photo
   on a P1 to demote it to T.
2. **Insert a T between them** — a `paragraph_block`, `quote_pullquote`,
   `bullet_list`, etc.
3. **Reorder** — move one bg section earlier or later on the page so a
   T already in the page sits between them.

### Current state across all 11 pages

| Page | Sequence |
|---|---|
| home | 🟦 ⬜ ⬜ 🟧 ⬜ 🟧 🟫 ⬜ 🟦 ⬜ ⬜ |
| about | 🟦 ⬜ ⬜ 🟦 ⬜ 🟫 |
| buyers | 🟦 ⬜ ⬜ 🟦 ⬜ 🟦 ⬜ |
| sellers | 🟦 ⬜ ⬜ 🟦 ⬜ 🟦 ⬜ |
| invest | 🟦 ⬜ ⬜ 🟦 ⬜ 🟦 ⬜ 🟫 |
| communities | 🟦 ⬜ 🟧 🟦 |
| closings | 🟦 🟧 |
| reviews | 🟦 ⬜ 🟫 |
| partners | 🟦 ⬜ 🟦 ⬜ |
| contact | 🟦 ⬜ ⬜ |
| privacy | 🟦 ⬜ ⬜ 🟦 ⬜ ⬜ 🟦 |

No same-bucket adjacency on any page. ✅

**Block types that always carry a wrapper bg:**
`hero`, `dark_break` — their whole identity is the photo.

**Block types that NEVER carry a wrapper bg** (their cards do):
`three_cards` (when cards have images), `community_grid`,
`closings_grid`, `partners_directory`, `reviews_strip` (glass cards),
`reviews_full` (glass cards), `practice_areas` (numbered glass cards).

**Block types that CAN have a wrapper bg** (used as variety/anchors):
`paragraph_block`, `bullet_list`, `stats_strip`, `cta_band`, `faq`,
`process_steps`, `quote_pullquote`, `two_column`, `valuation_form`,
`contact_form`.

When you add a new block via Admin → Page Builder → + Add Block, the
admin doesn't currently enforce this rule for you — it's a design
discipline. If you violate it, run `scripts/normalizeSectionBackgrounds.ts`
again (or just manually toggle off the wrapper image in the offending
section's edit modal).

---

## 4. Block library — the 24 types

Every block carries an optional `data.wrapper` object:

```ts
{ backgroundImage?: { image_id }, backgroundYouTubeUrl?: string,
  overlay?: 'none'|'light'|'dark'|'heavy',
  spacing?: 'compact'|'normal'|'large',
  theme?: 'cream'|'white'|'navy'|'transparent' }
```

This is rendered by `BlockShell` and edited in the "Section Background & Style"
accordion at the bottom of every block's Edit modal.

| Type | Label | Category | File |
|---|---|---|---|
| `hero` | Hero | Hero & Headers | `components/blocks/HeroBlock.tsx` |
| `meet_agent` | Meet the Agent | Content & Cards | `components/blocks/ContentBlocks.tsx` |
| `three_cards` | Three Ways I Help | Content & Cards | `components/blocks/ContentBlocks.tsx` |
| `practice_areas` | Practice Areas (Numbered) | Content & Cards | `components/blocks/ContentBlocks.tsx` |
| `two_column` | Two Column (Text + Image) | Content & Cards | `components/blocks/ContentBlocks.tsx` |
| `paragraph_block` | Heading + Paragraphs | Content & Cards | `components/blocks/SimpleBlocks.tsx` |
| `quote_pullquote` | Pull Quote | Content & Cards | `components/blocks/SimpleBlocks.tsx` |
| `stats_strip` | Stats Strip | Numbers & Lists | `components/blocks/SimpleBlocks.tsx` |
| `process_steps` | Process Steps (Numbered) | Numbers & Lists | `components/blocks/ContentBlocks.tsx` |
| `bullet_list` | Bullet List | Numbers & Lists | `components/blocks/SimpleBlocks.tsx` |
| `faq` | FAQ Accordion | Numbers & Lists | `components/blocks/SimpleBlocks.tsx` |
| `dark_break` | Dark Photo Strip | Visuals | `components/blocks/SimpleBlocks.tsx` |
| `video_embed` | Video (Embed) | Visuals | `components/blocks/SimpleBlocks.tsx` |
| `community_grid` | Community Grid (6 Cards) | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `comparison_table` | Community Comparison Table | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `reviews_strip` | Reviews Strip (featured) | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `reviews_full` | Reviews (Full List) | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `closings_grid` | Closings Grid | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `partners_directory` | Partners Directory | Special Sections | `components/blocks/SpecialBlocks.tsx` |
| `cta_band` | Call-to-Action Band | Forms & CTAs | `components/blocks/SimpleBlocks.tsx` |
| `valuation_form` | Valuation Form | Forms & CTAs | `components/blocks/FormBlocks.tsx` |
| `contact_form` | Contact Form | Forms & CTAs | `components/blocks/FormBlocks.tsx` |
| `direct_contact` | Direct Contact Card | Forms & CTAs | `components/blocks/SpecialBlocks.tsx` |
| `bottom_signoff` | Sign-Off Line | Footer | `components/blocks/SimpleBlocks.tsx` |

### Special blocks — where their data comes from

These 7 blocks pull from their own tables; their `data` JSON only holds
headings/intro copy:

| Block | Data source | Edit at |
|---|---|---|
| `community_grid` · `comparison_table` | `communities` table | `/admin/communities` |
| `reviews_strip` · `reviews_full` | `reviews` table | `/admin/reviews` |
| `closings_grid` | `closings` table | `/admin/closings` |
| `partners_directory` | `partners` + `partner_categories` tables | `/admin/partners` |
| `direct_contact` | `site` constants in `lib/site.ts` (phone, email, licenses) | `/admin/brand` (Brand Identity) |
| `meet_agent` | `media` portrait via `getPortrait()` | `/admin/brand` (Realtor Image) |

`meet_agent` text content is part of its own block `data`; only the portrait
photo comes from the global Brand Identity.

---

## 5. Page-by-page wiring

### Pattern (all 10 fixed pages + every custom page)

```
URL                  →  app/<dir>/page.tsx
                          ↓
                   <PageRenderer pageKey="…" />
                          ↓
                   getPageBlocks("…") from page_blocks
                          ↓
                   render each block's component in order
```

Every page below is **fully editable** via `/admin/builder/<key>` — add /
remove / reorder / toggle / duplicate / edit content, including the
background-image-or-YouTube-video / overlay / theme / spacing wrapper.

#### 5.1 Home — `/`

| Field | Value |
|---|---|
| Source file | `app/page.tsx` |
| Page key | `home` |
| Live URL | `/` |
| Admin URL | `/admin/builder/home` |

Default sections (10):

1. `hero` — eyebrow / title lines / subtitle / CTAs / stats
2. `meet_agent` — Meet Shoukoufa intro + portrait
3. `dark_break` — "What Clients Say Most" photo strip
4. `three_cards` — Three Ways I Help (Buying / Selling / Invest)
5. `community_grid` — six neighborhood cards (data from `communities` table)
6. `cta_band` — Invest teaser
7. `cta_band` — Recent Closings teaser
8. `dark_break` — "Why I Do This Work" photo strip
9. `reviews_strip` — featured reviews (data from `reviews` table)
10. `bottom_signoff` — closing line

#### 5.2 About — `/about`

| Field | Value |
|---|---|
| Source file | `app/about/page.tsx` |
| Page key | `about` |
| Admin URL | `/admin/builder/about` |

Sections: `hero` · `meet_agent` (A Note From Shoukoufa) · `practice_areas`
(What I do) · `dark_break` (What Stays With Clients) · `paragraph_block`
(Licensed and affiliated credentials) · `cta_band`

#### 5.3 Buyers — `/buyers`

| Field | Value |
|---|---|
| Source file | `app/buyers/page.tsx` |
| Page key | `buyers` |
| Admin URL | `/admin/builder/buyers` |

Sections: `hero` · `three_cards` (why a buyer's agent matters) ·
`process_steps` (six steps from search to keys) · `dark_break` (Between Steps) ·
`three_cards` (Loan programs) · `cta_band` (first-time callout) ·
`cta_band` (closing)

#### 5.4 Sellers — `/sellers`

| Field | Value |
|---|---|
| Source file | `app/sellers/page.tsx` |
| Page key | `sellers` |
| Admin URL | `/admin/builder/sellers` |

Sections: `hero` · `three_cards` (what changes with me) · `process_steps`
(six steps to sold) · `dark_break` (Pricing & Marketing) · `paragraph_block`
(price right) · `valuation_form` · `cta_band`

#### 5.5 Invest — `/invest`

| Field | Value |
|---|---|
| Source file | `app/invest/page.tsx` |
| Page key | `invest` |
| Admin URL | `/admin/builder/invest` |

Sections: `hero` · `paragraph_block` (the truth) · `process_steps` (four
steps) · `stats_strip` · `bullet_list` (who it's for) · `dark_break` ·
`faq` · `cta_band`

#### 5.6 Communities (index) — `/communities`

| Field | Value |
|---|---|
| Source file | `app/communities/page.tsx` |
| Page key | `communities` |
| Admin URL | `/admin/builder/communities` |

Sections: `hero` · `comparison_table` (from `communities` table) ·
`community_grid` · `dark_break`

> Per-community detail pages at `/communities/<slug>` use the
> `communities` table directly (separate from the block builder). Edit
> there via **Admin → Communities → [slug]**.

#### 5.7 Recent Closings — `/closings`

| Field | Value |
|---|---|
| Source file | `app/closings/page.tsx` |
| Page key | `closings` |
| Admin URL | `/admin/builder/closings` |

Sections: `hero` · `closings_grid` (from `closings` table)

#### 5.8 Reviews — `/reviews`

| Field | Value |
|---|---|
| Source file | `app/reviews/page.tsx` |
| Page key | `reviews` |
| Admin URL | `/admin/builder/reviews` |

Sections: `hero` · `reviews_full` (from `reviews` table) · `cta_band`

#### 5.9 Trusted Partners — `/partners`

| Field | Value |
|---|---|
| Source file | `app/partners/page.tsx` |
| Page key | `partners` |
| Admin URL | `/admin/builder/partners` |

Sections: `hero` · `partners_directory` (from `partners` table) ·
`dark_break` · `cta_band`

#### 5.10 Contact — `/contact`

| Field | Value |
|---|---|
| Source file | `app/contact/page.tsx` |
| Page key | `contact` |
| Admin URL | `/admin/builder/contact` |

Sections: `hero` · `contact_form` · `direct_contact`

#### 5.11 Privacy — `/privacy`

| Field | Value |
|---|---|
| Source file | `app/privacy/page.tsx` |
| Page key | `privacy` |
| Admin URL | `/admin/builder/privacy` |

Sections (7 seeded): `hero` · `paragraph_block` (Your Information) · `paragraph_block`
(Communications) · `paragraph_block` (Cookies & Analytics) · `bullet_list`
(Real Estate Disclaimers) · `paragraph_block` (Licensing) · `paragraph_block`
(Contact Shoukoufa)

#### 5.12 Custom pages — `/<slug>`

| Field | Value |
|---|---|
| Source file | `app/[slug]/page.tsx` (dynamic catch-all) |
| Page key | the slug itself |
| Admin URL | `/admin/builder/<slug>` (or via **Admin → Pages** → click row) |
| Lifecycle | created via **Admin → Pages → + New Page** → draft → publish |

Each custom page row in `pages` table has `slug · title · description ·
published · show_in_nav · nav_order`. Blocks live in `page_blocks` keyed by
the same slug.

---

## 6. Cross-cutting data sources (edited outside the page builder)

These feed into multiple pages. The block content (headings, intros) is edited
in the page builder; the data they wrap is edited in their own admin section.

### 6.1 Brand Identity — `/admin/brand`

Stored as `content_blocks` rows under `page = "brand"` (the only page still
using the legacy content_blocks system). Edited via dedicated admin forms,
NOT via the page builder.

| Section | Key | Affects |
|---|---|---|
| `identity` | `brand.identity` | Name, role, brokerage, tagline, service area, languages — used in `direct_contact`, footer copyright, page metadata, header logo subtitle |
| `portrait` | `brand.portrait` | Realtor photo — used in header avatar, footer avatar, About page hero + bio, homepage `meet_agent` |
| `brokerLogo` | `brand.brokerLogo` | REMAX Galaxy logo in footer + open-house flyer |
| `favicon` | `brand.favicon` | Browser tab icon |
| `featuredImage` | `brand.featuredImage` | Default OpenGraph share image |

### 6.2 Communities — `/admin/communities`

The 6 community records (Alexandria, Arlington, Vienna, McLean, Falls Church,
Great Falls). Each has slug, name, tagline, median price, YoY %, days on
market, market type, about paragraph, 2026 market paragraph, price tiers,
schools / parks / dining / commute, Shoukoufa's quote, image.

Used by:
- `community_grid` block (cards)
- `comparison_table` block (rows)
- `/communities/<slug>` per-community detail pages
- `closings_grid` filtering

### 6.3 Reviews — `/admin/reviews`

12 seeded Zillow reviews + however many Shoukoufa adds. Each: source · author ·
short label · rating · quote · written date · `is_featured_homepage` · display
order · visible flag · status (pending/approved/rejected).

Used by:
- `reviews_strip` (only `is_featured_homepage = true`)
- `reviews_full` (all approved + visible)
- Homepage stat counter

### 6.4 Recent Closings — `/admin/closings`

Sold property records. Each: image · address line · city · state · price ·
list date · sale date · property type · notes.

Used by `closings_grid` block.

### 6.5 Trusted Partners — `/admin/partners`

Lender / inspector / insurance / trades directory. Categories editable too.

Used by `partners_directory` block.

### 6.6 Open Houses — `/admin/open-houses`

Each open house gets:
- a landing page at `/open-house/<slug>`
- a printable A4 flyer
- an auto-generated RSVP form

**Open house pages do NOT go through the page builder** — they're hand-coded
React with their own layout because the flyer has to print perfectly. Edited
via `/admin/open-houses/<slug>`.

### 6.7 SEO / County Landing Pages — `/admin/seo`

Per-county landing pages at `/realtor-in/<county>`. Drive paid-ad traffic.
**Not in the page builder** — hand-coded with their own template (`app/realtor-in/[slug]/page.tsx`).

### 6.8 Forms — `/admin/forms`

Custom forms (questionnaires, surveys, capture pages). Each renders at
`/form/<slug>`. Edited via `/admin/forms/<slug>`. Submissions land in `leads`
table → **Admin → Inbox**.

**Form-rendered pages are NOT in the page builder** — they share the
`PublicFormRenderer` component which reads the form definition.

### 6.9 Integrations — `/admin/integrations`

Google Analytics 4 Measurement ID, Google Reviews integration credentials,
Google Business Profile link. Stored in `integrations` table.

GA4 ID is read by `app/layout.tsx` at request time and injected as
`<script>gtag.js</script>`.

### 6.11 Site Settings — `/admin/settings`

Singleton `site_settings` row holds the brand-wide values that used to be
hardcoded in `lib/site.ts`. Loaded via `lib/siteSettings.ts` `getSiteSettings()`
in the root layout and passed down to Footer + Header via props.

Four tabs in the admin UI:

| Tab | Edits |
|---|---|
| **Contact** | Phone (display + tel: link), email (+ mailto:), brokerage office (name / street / city·state·zip / phone), Virginia / Maryland / D.C. license numbers |
| **Social** | Instagram, Facebook, TikTok, YouTube, LinkedIn URLs |
| **Header Nav** | For the 10 fixed routes: toggle visibility, drag-reorder, rename label. Custom pages with `show_in_nav = true` slot in automatically before Contact. |
| **Page Metadata** | Title + meta description for every fixed route + Privacy. Read by each page's `generateMetadata()` from the `page_meta` table. |

### 6.12 Team — `/admin/team`

Roster of admin users with role (owner / editor). For now invite flow is
manual: create user via Supabase Auth Admin API + insert row in `team_members`.

---

## 7. Routes that are intentionally NOT in the page builder

These have their own templates because they need very specific layouts.

| Route | Source file | Why hand-coded |
|---|---|---|
| `/open-house/<slug>` | `app/open-house/[slug]/page.tsx` | Flyer-perfect layout + print stylesheet |
| `/realtor-in/<county>` | `app/realtor-in/[slug]/page.tsx` | County-specific SEO template (different per-county fields) |
| `/form/<slug>` | `app/form/[slug]/page.tsx` | Form renderer reads `forms` table definition |
| `/leave-review` | `app/leave-review/page.tsx` | Embedded review widget for sharing externally |
| `/leave-review-internal` | `app/leave-review-internal/page.tsx` | Private internal-feedback channel |
| `/communities/<slug>` | `app/communities/[slug]/page.tsx` | Per-community detail page reads from `communities` table |
| `/sitemap.xml` | `app/sitemap.ts` | Generated dynamically including all custom pages |
| `/robots.txt` | `app/robots.ts` | Static |

If we ever need any of these to be admin-composable, they can be converted to
the page-builder model the same way the 10 fixed pages were.

---

## 8. What's NOT editable from the admin panel

Everything below requires a developer to change (code edit + deploy).

### 8.1 Site-wide chrome
- **Header** — logo placement, contact button position, hamburger drawer
  structure (`components/Header.tsx`, `components/MenuDrawer.tsx`,
  `components/Logo.tsx`). Brand name / role text + portrait DO update from
  Brand Identity, but layout is fixed.
- **Footer** — column layout, newsletter form, social icon set, compliance
  logos (`components/Footer.tsx`). Brand text + phone / email / address /
  social URLs come from `lib/site.ts`, which is hardcoded — see "Brand
  constants in `lib/site.ts`" below.

### 8.2 Brand constants in `lib/site.ts` — ✅ now ADMIN-EDITABLE

Most of these moved into the `site_settings` table and are edited via
**Admin → Site Settings**. `lib/site.ts` stays as the compile-time fallback
in case the DB is unavailable.

- ✅ Phone number + tel link — `Site Settings → Contact`
- ✅ Email + mailto link — `Site Settings → Contact`
- ✅ Brokerage office (name, street, city/state/zip, phone) — `Site Settings → Contact`
- ✅ License numbers (VA, MD, DC) — `Site Settings → Contact`
- ✅ Social URLs (Instagram, Facebook, TikTok, YouTube, LinkedIn) — `Site Settings → Social`
- ✅ Fixed-nav order + visibility + labels — `Site Settings → Header Nav`
- ❌ **Office address** (`site.office`) — still in `lib/site.ts`, currently only used as a fallback. Brokerage office in Site Settings is the live one.
- ❌ **Brokerage logo path** (`brokerageOffice.logoSrc`) — image picker not yet wired into Site Settings. Path is hardcoded to `/images/Remax%20Galaxy.png`.
- ❌ **Hero stats fallbacks** (the `heroStats` constant) — only used as a last-resort fallback; the actual stats live on the homepage Hero block's `stats` field.

### 8.3 Block library itself
- The 24 block types are defined in `lib/blockRegistry.ts`. You can use,
  reorder, duplicate, and delete instances of them, but **adding a new block
  TYPE requires a developer** (a new component + registry entry).
- Examples of new types that would need dev work:
  - "Mortgage calculator"
  - "Interactive map"
  - "Email-signup with Mailchimp integration"
  - "Embedded property listing search"

### 8.4 Routes / URLs
- The 10 fixed route folders (`/about`, `/buyers`, etc.) — slug is the
  folder name. You can't rename `/about` to `/who-i-am` from admin.
  *Workaround*: create a custom page at the new slug and disable the old
  route via dev edit (or stop linking to it).
- Reserved slugs that block custom page creation: `admin`, `api`, `about`,
  `buyers`, `sellers`, `invest`, `communities`, `closings`, `reviews`,
  `partners`, `contact`, `privacy`, `leave-review`, `leave-review-internal`,
  `form`, `open-house`, `realtor-in`, `sitemap.xml`, `robots.txt`,
  `favicon.ico`, `icon`, `_next`. The list lives in `lib/customPages.ts`.

### 8.5 Hand-coded routes (§7 above)
- `/privacy` page body — long-form legal HTML
- `/open-house/<slug>` template + flyer layout
- `/realtor-in/<county>` template (county-fields editable per row in
  `county_landing_pages`, but template itself is fixed)
- `/leave-review` and `/leave-review-internal` widgets
- Per-community `/communities/<slug>` template layout (fields editable per
  row in `communities` table)
- Form-rendered pages at `/form/<slug>` (form definition editable, but the
  surrounding page chrome is fixed)

### 8.6 Styling / theming
- **Colors** — Tailwind theme tokens in `tailwind.config.ts` and CSS
  variables in `app/globals.css` (navy, cream, ink, brand-primary). The
  `Brand → Brand Theme` editor can override `--brand-primary-rgb` etc. for
  the CTA button color, but the overall palette (navy navy-dark, cream,
  cream-soft) is fixed.
- **Fonts** — Montserrat loaded in `app/layout.tsx`. To change, swap the
  `next/font/google` import.
- **Frosted glass values** — opacity / blur values per glass-*  CSS class
  in `app/globals.css`.
- **Image quality / Cloudinary transforms** — `q_auto:best`, `dpr_auto`,
  `fl_progressive`, default widths — all in `lib/cloudinary.ts`.
- **Hero font-size clamp** — `clamp(1.25rem, 6.5vw, 6rem)` in
  `components/Hero.tsx` and `HeroBlock.tsx`.

### 8.7 Animations / motion
- Reveal animations (fade-in-up, blur-in) defined in `app/globals.css` +
  `components/Reveal.tsx`.
- Counter animation duration / easing — `components/Counter.tsx`.

### 8.8 System / infrastructure
- **Supabase env vars** — URL, anon key, service role key in `.env.local` +
  Netlify env vars.
- **Cloudinary** — cloud name, API key, secret, upload preset name (preset
  contents like folder name CAN be edited via Cloudinary dashboard, but the
  preset name in env vars cannot be changed from admin).
- **Netlify build / domain settings** — managed in Netlify dashboard.
- **GitHub repo / branches** — `umairahmad012/shoukoufa-website`.
- **Database schema** — every table structure requires a migration in
  `supabase/migrations/`.
- **DNS** — for connecting `shoukoufahomes.com`, that lives at the registrar.
- **Email sending** (when forms submit) — none configured yet; would need
  Resend / SendGrid integration.

### 8.9 SEO basics
- ✅ **`<title>` and `<meta description>` for every fixed page** — editable
  in `Site Settings → Page Metadata`. Reads from the `page_meta` table
  via `generateMetadata()` in each route.
- ✅ Custom pages get their title / description from the `pages` table
  (Custom Pages screen).
- ❌ **Sitemap priority + change-frequency** per route — hardcoded in
  `app/sitemap.ts`. Custom pages auto-appear with default priority.
- ❌ **robots.txt** — `app/robots.ts`.
- ✅ **Default OpenGraph image** — Brand → Featured Image.
- ❌ **Per-route OG image overrides** (open-house listings, etc.) — code-level.

### 8.10 Page-builder edge controls
- **Block-internal element order** — e.g. swapping image-left / image-right
  in `meet_agent` is editable (the `portraitSide` field), but more granular
  controls like reorder-the-stat-counters or hide-just-the-button-not-the-
  whole-block aren't exposed yet.
- **Per-block fine styling** — padding, font weights, link colors. The
  wrapper handles spacing presets (`compact` / `normal` / `large`) and
  theme (`cream` / `white` / `navy` / `transparent`), but anything more
  precise needs a developer.

---

## 9. Quick lookup — "where do I change X?"

| If you want to change… | Go to |
|---|---|
| Section text on Home / About / etc. | `/admin/builder/<page>` → click ⚙ on the section |
| Add a new section to a page | `/admin/builder/<page>` → + Add Block |
| Background image / video on a section | Same Edit modal → "Section Background & Style" accordion |
| Reorder sections | `/admin/builder/<page>` → ↑ / ↓ |
| Hide a section without deleting | `/admin/builder/<page>` → 👁 toggle |
| Create a brand new page | `/admin/pages` → + New Page |
| Publish a draft page | `/admin/pages` → click 👁 on the row |
| Put a custom page in the header menu | `/admin/pages` → ⚙ on row → "Show in header nav" |
| Phone, email, brokerage office, licenses | `/admin/settings` → Contact |
| Social URLs (Instagram, Facebook, TikTok, YouTube, LinkedIn) | `/admin/settings` → Social |
| Header navigation order / visibility / labels | `/admin/settings` → Header Nav |
| Page title or meta description (any fixed page) | `/admin/settings` → Page Metadata |
| Realtor name / role / brokerage / tagline | `/admin/brand` → Brand Identity |
| Realtor portrait | `/admin/brand` → Realtor Image |
| Broker / brokerage logo | `/admin/brand` → Broker Image |
| Favicon | `/admin/brand` → Favicon |
| Default social-share image | `/admin/brand` → Site Featured Image |
| Community market data / quotes | `/admin/communities` → row |
| Reviews — add / delete / feature on homepage | `/admin/reviews` |
| Closings | `/admin/closings` |
| Partners | `/admin/partners` |
| Open house listings | `/admin/open-houses` |
| Form submissions inbox | `/admin/inbox` |
| Custom forms | `/admin/forms` |
| County landing pages (SEO) | `/admin/seo` |
| Google Analytics ID | `/admin/integrations` |
| Privacy policy text | `/admin/builder/privacy` |
| Create a new page (e.g. "Moving to Vienna") | `/admin/pages` → + New Page |
| Add a new admin user | `/admin/signup` (first user only) or manual SQL after |
| Tweak colors, fonts, motion, layout chrome | **Code edit** (see §8.6) |

---

## 10. Where this lives in code (the must-know files)

- `app/[slug]/page.tsx` — custom-page catch-all
- `app/page.tsx` + `app/{about,buyers,sellers,invest,communities,closings,reviews,partners,contact}/page.tsx` — all 9 lines each, all just render `<PageRenderer pageKey="…" />`
- `app/admin/builder/[page]/page.tsx` + `actions.ts` — the builder route + server actions
- `app/admin/pages/page.tsx` + `actions.ts` — custom pages CRUD
- `components/admin/builder/BuilderClient.tsx` — the entire interactive builder UI
- `components/admin/pages/PagesListClient.tsx` — pages-list UI + create/edit modals
- `components/blocks/PageRenderer.tsx` — block_type → component routing
- `components/blocks/BlockShell.tsx` — universal wrapper (bg image / video / overlay / theme / spacing)
- `components/blocks/{HeroBlock,SimpleBlocks,ContentBlocks,SpecialBlocks,FormBlocks}.tsx` — every block component
- `lib/blockRegistry.ts` — block type definitions + auto-form schemas
- `lib/pageBlocks.ts` — block loader
- `lib/customPages.ts` — pages table loader + slug validator (with the reserved-slug list)
- `lib/site.ts` — compile-time DEFAULTS only. Live values come from `lib/siteSettings.ts` `getSiteSettings()` reading `site_settings` table.
- `lib/siteSettings.ts` — runtime loader for brand constants + per-page metadata
- `app/admin/settings/` — Site Settings admin (Contact / Social / Header Nav / Page Metadata)
- `lib/content.ts` — legacy static content defaults (used as fallback before DB is populated)
- `supabase/migrations/0014_page_blocks.sql` + `0015_custom_pages.sql` + `0016_site_settings.sql` — the page-builder + custom-pages + site-settings migrations

---

*Update this doc whenever the architecture changes. It's the source of truth
for "how is the site put together" — keep it close to reality.*
