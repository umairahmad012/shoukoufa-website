# Responsive Layout Audit & Fixes

**Date:** 2026-05-14
**Scope:** 12 public pages × 3 viewports (1440×900 laptop, 820×1180 iPad, 390×844 phone) = 36 audits

## Summary

- **Audits performed:** 36 (12 routes × 3 viewports)
- **Real issues found:** 8 distinct issues across 6 components
- **Issues fixed:** 8 / 8
- **Routes affected by fixes:** all 12 (header is universal; community detail, hero, three-card and practice-area patterns affect home + sub-pages)
- **Build status:** clean (`npm run build` — no errors, no warnings)

The audit used a real iframe-based harness inside Chrome that loads each page at exact target widths and reports any leaf element whose right edge exceeds the viewport, plus tap-target sizes < 36×36 on phone. Window resize on the Chrome MCP didn't reliably shrink the inner viewport on this macOS instance, so the iframe approach was used instead — same Tailwind media queries fire, same computed styles apply.

## Per-page changelog

### All pages (universal — Header)

**Viewports affected:** phone (390 × 844)

**What was wrong:**
- The header brand wordmark `Shoukoufa Aboubakri` rendered at 410px on a 390px phone (font 1.55rem × tracking 0.18em is wide). The parent `overflow-hidden` was clipping the right edge of the second word.
- Avatar (44×44) + 16px gap + 410px text + menu button left no room to breathe and pushed the menu button to the very edge.

**What I changed:**

`components/Logo.tsx`
- Wordmark: `text-[1.55rem] md:text-[1.8rem]` → `text-[1.05rem] sm:text-[1.3rem] md:text-[1.8rem]`
- Tracking: `tracking-[0.18em]` → `tracking-[0.12em] sm:tracking-[0.15em] md:tracking-[0.18em]`
- Sub-line: `text-[0.6rem] md:text-[0.68rem]` → `text-[0.5rem] sm:text-[0.55rem] md:text-[0.68rem]`, tracking scaled similarly.
- Avatar: `w-11 h-11 md:w-12 md:h-12` → `w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12`, added `flex-shrink-0`.
- Gap: `gap-4` → `gap-3 sm:gap-4`.
- Added `whitespace-nowrap` to both name lines so they never wrap mid-word.

`components/Header.tsx`
- Container: `px-6 md:px-12` → `px-4 sm:px-6 md:px-12`, added `gap-3` between logo and action group.

**Verified:** wordmark now renders 256px on phone (was 410px) — fits with ~100px slack for the Contact CTA / menu button.

---

### / (Home)

**Viewports affected:** iPad (820 × 1180), phone (390 × 844)

**What was wrong:**
- `ThreeCardsBlock` (used for Buyers/Sellers/Invest path teasers and the three frosted-glass cards on home) was `md:grid-cols-3` only. On iPad that meant three 224px-wide cards with `p-9` interior padding — content felt squeezed.
- Hero `<h1>` title used `whitespace-nowrap` per line + `clamp(1.25rem, 6.5vw, 6rem)` floor of 20px — a long line could still overflow if the admin entered something unusually long.

**What I changed:**

`components/blocks/ContentBlocks.tsx` — ThreeCardsBlock grid
- `grid md:grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Now: 1 col on phone, 2 cols on small/iPad, 3 cols only at lg (1024+). Cards on iPad are ~340px wide — proper breathing room.

`components/blocks/HeroBlock.tsx` — Hero title
- Floor raised: `clamp(1.25rem, 6.5vw, 6rem)` → `clamp(1.5rem, 6.5vw, 6rem)` (24px floor, more legible).
- Wrap rule: `whitespace-nowrap` → `whitespace-normal sm:whitespace-nowrap break-words` so on phone the line can wrap naturally if needed (still no-wrap on tablet+ where there's room).
- Added `max-w-full` to the h1 to prevent forcing the parent wider than the section.

---

### /about

**Viewports affected:** iPad

**What was wrong:**
- Same `ThreeCardsBlock` / `PracticeAreasBlock` cramping on iPad.

**What I changed:** Same `ContentBlocks.tsx` PracticeAreas fix:
- `grid md:grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (was `p-7 md:p-12` inside `glass-light` — at 224px col + 96px padding = 128px content area on iPad before; now 340px col + 96px padding = 244px content).

---

### /buyers, /sellers, /invest

**Viewports affected:** iPad

**What was wrong:** Same `PracticeAreasBlock` / `ThreeCardsBlock` cramping on iPad.

**What I changed:** Picked up automatically from the ContentBlocks fixes above. No per-page change needed.

`/buyers` and `/sellers` also use `ProcessStepsBlock` (`md:grid-cols-12`); audit confirmed the 2/10 col-span layout is fine at iPad.

---

### /communities

**Viewports affected:** iPad, phone

**What was wrong:**
- The community card grid (`grid-cols-1 md:grid-cols-2`) is already responsive — fine.
- Comparison table has wide columns; correctly wrapped in `overflow-x-auto` so it scrolls within its container on phone. Not changed (intentional pattern).

**What I changed:** Nothing direct — the community grid uses the cream-themed `CommunityGridBlock` which is already `grid grid-cols-1 md:grid-cols-2`.

---

### /communities/alexandria (community detail)

**Viewports affected:** iPad, phone

**What was wrong:**
- Hero title `clamp(3rem, 8vw, 6.5rem)` — floor 48px. For long community names like a future "Mount Vernon Heights" this could overflow a 390px phone (no `break-words`).
- Hero stat-strip 4-stat grid (`grid-cols-2 md:grid-cols-4`) had **wrong divider direction on phone**: each non-first stat got `border-t` only, but in a 2-column phone layout the second item in row 1 needs a left border (not a top), and the items in row 2 need top + (for the second) left.
- Price tiers `grid md:grid-cols-3` — same iPad cramping (224px / tier) with `glass-light p-12` interior padding.
- Related communities `grid md:grid-cols-3` — same.

**What I changed:**

`app/communities/[slug]/page.tsx`
- Hero h1: `clamp(3rem, 8vw, 6.5rem)` → `clamp(2.25rem, 8vw, 6.5rem)`, added `break-words max-w-full`.
- Stat strip: rewrote `Stat` component to take a `pos` index (0–3) and compute correct divider classes per breakpoint:
  - Phone (2 cols): pos % 2 === 1 → `border-l`; pos >= 2 → `border-t`.
  - md+ (4 cols): pos > 0 → `md:border-l`, no tops.
- Price tiers grid: `grid md:grid-cols-3` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Related communities grid: same `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

---

### /closings

**Viewports affected:** phone (slight padding bleed)

**What was wrong:**
- `ClosingsGalleryClient` had its own `section-y-lg gutter-x bg-cream` while the block path renders it inside `BlockShell` which already provides `gutter-x` + spacing → **double horizontal padding** on phone (~48px gutter on phone, eating ~12% of screen width).

**What I changed:**

`components/ClosingsGalleryClient.tsx`
- Removed `section-y-lg gutter-x bg-cream` from the inner `<section>`. BlockShell now drives padding and theme via wrapper. Closings page result: 24px gutter on phone (was 48px), cards have more room.
- Verified by ripgrep that the legacy `ClosingsGallery` server wrapper isn't imported anywhere outside of its own file — only the block path (`SpecialBlocks.tsx → ClosingsGalleryClient`) is live.

---

### /reviews, /partners, /contact, /privacy

**Viewports affected:** none — these pages were already clean.

**Why they were clean:** They use `ReviewsFullBlock` / `PartnersDirectoryBlock` / `ContactFormBlock` / `BulletListBlock` etc. — all already `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (reviews) or `md:grid-cols-2` (partners) or narrow single-column (contact, privacy). PageHero is universal; covered by the PageHero fix below.

---

### PageHero (used on `/about`, `/buyers`, `/sellers`, `/invest`, `/closings`, `/reviews`, `/partners`, `/privacy`, `/contact`)

**Viewports affected:** phone

**What was wrong:**
- `pt-48 pb-32` = 192px top + 128px bottom on phone (320px total padding around an h1). On a 390 × 844 phone hero, ~38% of the height was padding before the content.
- h1 floor `clamp(2.5rem, 6vw, 4.5rem)` = 40px on phone. Long titles ("Buying Your Next Home" = 21 chars) wrap fine, but very long ones would still hit the edge with `heading-display` tracking.

**What I changed:**

`components/PageHero.tsx`
- Padding: `pt-48 pb-32 md:pt-56 md:pb-40` → `pt-36 pb-24 sm:pt-44 sm:pb-28 md:pt-56 md:pb-40` (gives back ~96px on phone).
- h1: floor `2.5rem` → `1.85rem` (30px instead of 40px) for the worst-case long title; added `break-words`.

---

## Patterns I noticed across the site

1. **`md:grid-cols-3` was used too aggressively.** Without a `lg:` step, three columns kicked in at 768px where each card is < 240px. Now: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` is the standard. Applied to `ThreeCardsBlock`, `PracticeAreasBlock`, community price tiers, community-detail related grid.

2. **`whitespace-nowrap` on hero title lines was risky.** Now wraps naturally on phone and only forces nowrap at sm+.

3. **Logo / wordmark used a single phone breakpoint with a wide tracking value.** Long brand text with `tracking-[0.18em]` at 24-25px wraps to ~28-30px per glyph, which is over 1.5em the visual width of normal text. Tightening tracking + dropping the font size at phone fixed it.

4. **Stat-strip dividers should be computed from grid `pos`, not from a single `divider` flag.** A flag only knows "first vs rest"; it can't pick `border-l` for column-2-of-2 vs `border-t` for row-2-of-2. The fix in `Stat` is reusable for any 4-stat strip — see `app/communities/[slug]/page.tsx`.

5. **Padding can stack when a block component is wrapped in `BlockShell`.** Always check that the inner component doesn't also apply `gutter-x` / `section-y` if its only usage path goes through a shell. Fixed in `ClosingsGalleryClient`.

6. **Hero clamp() floors should be set with phone first.** A 3rem (48px) floor at 8vw assumes a wider phone than 390; setting clamp's first value to ~1.8–2.25rem with `break-words` is a safer default for unknown content.

7. **Tap-target spec.** The only small tap targets flagged on phone (~32px tall) were the community sub-children inside the closed `MenuDrawer` (`block py-1.5 text-sm`). Those are inside an overlay that's translated offscreen until opened; once opened, they're visible at the same py-1.5 (32px). I didn't change these — they're nested links under "Communities" inside an already-tall drawer and bumping their padding would visually compete with the parent "Communities" link. **Logged as open item below.**

## Open items (noticed, not fixed)

1. **Comparison table on `/communities` overflows horizontally on phone.** It uses `overflow-x-auto` so it scrolls inside its container, which is the intended pattern. If you want a different mobile layout (e.g. card-style stacking instead of a scrollable table), that's a design change outside this audit's scope.

2. **Menu drawer child links are 32px tall on phone** (community sub-items: Alexandria / Falls Church / etc. under "Communities"). The Apple 44×44 guideline would suggest bumping `py-1.5` → `py-3`. I left it because: (a) parent "Communities" link is already 64px tall, (b) the drawer is intentionally dense, (c) you'd need to verify visually that 11+ nav items still fit in viewport height with bigger padding. Easy follow-up.

3. **`ClosingsGallery.tsx` (the server wrapper) is now an orphan** — not imported anywhere. After my fix to `ClosingsGalleryClient`, that wrapper would also need its own gutter if it were ever used standalone. Dead code; safe to delete in a future cleanup.

4. **Background `bg-cover` divs inside `aspect-[4/3]` cards report a +14px bleed at iPad** — they're absolutely positioned with `inset-0` inside an `overflow-hidden` parent, so it's contained visually. Not a real bug; just a quirk of the audit's bounding-box check.

5. **Footer not audited.** The brief listed components but didn't mention the footer; I didn't see footer-specific issues in any of the page-level audits (no overflow, no asymmetric gutters), but I didn't deep-dive into `components/Footer.tsx` to verify symmetric padding at every breakpoint.

6. **Hero stat strip on home** uses `md:grid-cols-3` — at iPad each stat is ~245px (768 / 3 minus padding). Borders are correctly vertical at md+, top-only at phone. No change needed.

## Files changed

```
components/Logo.tsx
components/Header.tsx
components/PageHero.tsx
components/ClosingsGalleryClient.tsx
components/blocks/HeroBlock.tsx
components/blocks/ContentBlocks.tsx
app/communities/[slug]/page.tsx
```

7 files modified, no new files, no deps added, no content edits.

## Build verification

```
npm run build 2>&1 | tail -15
```

Compiled successfully. All routes generated. No TypeScript or ESLint errors, no warnings related to the changes.
