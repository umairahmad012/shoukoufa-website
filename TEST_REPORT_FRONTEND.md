# Frontend Test Report

**Test target:** http://localhost:3009 (dev)
**Viewports tested:** Laptop 1440x900, iPad 820x1180, Phone 390x844
**Test date:** 2026-05-14
**Test method:** Same-origin iframe instrumentation via Chrome MCP (DOM measurement + computed style inspection on every page x every viewport). The OS-level `resize_window` could not shrink the inner viewport below ~500px on this machine; the iframe-fallback approach gave reliable per-viewport measurements but means the page renders inside a frame, so global scroll-bound effects (sticky-on-scroll header skin) were not exercised.

**Pages tested:** 19
`/`, `/about`, `/buyers`, `/sellers`, `/invest`, `/communities`, `/communities/alexandria`, `/communities/arlington`, `/communities/vienna`, `/communities/mclean`, `/communities/falls-church`, `/communities/great-falls`, `/closings`, `/reviews`, `/partners`, `/contact`, `/privacy`, `/leave-review`, `/leave-review-internal`

**Total issues found:** 14
  - P0 (blocking - broken/unusable): 0
  - P1 (visible bug - clearly wrong): 6
  - P2 (polish - minor improvement): 8

The site is in solid shape. No 404s, no broken links, no Samina references, no lorem-ipsum, no horizontal page overflow on any page x viewport. Phone is the cleanest viewport. iPad has the most clipping issues. Most P1 bugs are typography clipping in the header logo and the community cards at the iPad breakpoint, plus a CTA-tracking overflow on the home page.

---

## Issues by severity

### P0 - Blocking
None found. Every page renders, every navigation link routes correctly, every form is usable.

### P1 - Visible bugs

**P1-1. Header wordmark clips on iPad (every page)**
- **Page:** every page (header is global)
- **Viewport:** iPad 820x1180
- **Description:** The two-line wordmark inside the header logo link uses `whitespace-nowrap` on both the primary line ("Shoukoufa Aboubakri") and the subline ("Real Estate Specialist") with letter-spacing 0.36em. At 820px viewport width, the link's inner span has scrollWidth 540px vs clientWidth 519px (~21px overflow) and the inner wordmark span has scrollWidth 476 vs clientWidth 455 (~21px overflow). The overflow doesn't cause page H-scroll (the parent has `min-w-0`), but the wordmark visually crowds the right side and abuts the menu button.
- **Recommendation:** At the `md` (768px) and below breakpoint, either drop the subline "Real Estate Specialist", reduce the subline tracking from 0.36em to ~0.22em, or step the size down to `text-[1.1rem]` so the wordmark fits with breathing room.
- **Code pointer:** `components/Logo.tsx` lines 41-51, the two `<span>`s with `whitespace-nowrap` and `sm:tracking-[0.15em] md:tracking-[0.18em]` / `sm:tracking-[0.36em] md:tracking-[0.42em]`.

**P1-2. Home services-card CTAs clip on laptop**
- **Page:** `/`
- **Viewport:** Laptop 1440x900 (and iPad)
- **Description:** Inside the three "Buying / Selling / Invest" cards on the home page, the CTA span "BUYING WITH SHOUKOUFA ↗" measures 249px at letter-spacing 0.32em / font 10.88px, but its parent glass-card content area is only 219px wide; same for "SELLING WITH SHOUKOUFA ↗" (255px > 219px). "RUN THE NUMBERS ↗" fits (219px). The visible result is that the bottom CTA line is cropped against the right edge of the glass panel and the up-right arrow is pushed close to or past the edge.
- **Recommendation:** Either rename the CTAs ("Start buying" / "Start selling"), reduce md letter-spacing on the CTA from 0.32em to 0.22em-0.24em, or remove "WITH SHOUKOUFA" since the section heading already says "Three ways I help."
- **Code pointer:** `lib/content.ts` lines 71 ("Buying with Shoukoufa") and 78 ("Selling with Shoukoufa"); `components/PillarCards.tsx` line 83 (`tracking-[0.30em] md:tracking-[0.32em]`).

**P1-3. Community card H3 names clip on iPad**
- **Page:** `/communities` (grid), `/` (home grid)
- **Viewport:** iPad 820x1180
- **Description:** Community cards are 2-column at iPad. The H3 community name is `md:text-4xl` (36px) with `tracking-wide` (1.8px) inside a card whose inner glass panel is ~187px wide. Long names overflow: "ALEXANDRIA" scrollWidth 255px (~68px clipped), "ARLINGTON" 235px (~48px clipped). Vienna, McLean, Falls Church, Great Falls fit. The clipping is hidden by the parent `Link.overflow-hidden`, so the right side of the city name disappears.
- **Recommendation:** Add a `lg:text-4xl` step (use text-3xl at md, text-4xl at lg). Or reduce md letter-spacing inside the card. Or set `min-width` on the glass strip / move the H3 outside the side-padding constraints.
- **Code pointer:** `components/CommunitiesGrid.tsx` lines 70-73 (`text-2xl md:text-4xl uppercase tracking-wide`).

**P1-4. Community card "MEDIAN" stat label clips on iPad**
- **Page:** `/communities`, `/` (home grid)
- **Viewport:** iPad 820x1180
- **Description:** Three stat labels inside each community card ("MEDIAN" / "YOY" / "DOM") are in a 3-col grid with letter-spacing 0.28em. "MEDIAN" measures 57px vs container 52px (~5px clipped). Same pattern repeats on every community card. Minor but consistent.
- **Recommendation:** Drop md letter-spacing on stat labels from 0.28em to ~0.22em, or shrink the label font from `md:text-[0.6rem]` to `md:text-[0.55rem]`.
- **Code pointer:** `components/CommunitiesGrid.tsx` lines 78-79, 84-85, 100-101 (`tracking-[0.24em] md:tracking-[0.28em]`).

**P1-5. Home page has two cream-soft sections back-to-back**
- **Page:** `/`
- **Viewport:** All
- **Description:** Sections at index 4 and 5 are both `bg-cream-soft` (the "Three Ways I Help" services block and the Communities grid). They flow into each other as one continuous cream block with no visible separator, violating WIRING.md section 3.5 "no two same-bucket bg sections back-to-back". Other pages (about, buyers, sellers, invest) correctly alternate navy / transparent / cream.
- **Recommendation:** Either change one of the two to transparent/navy, or insert a DarkBreak / divider section between them (the DarkBreak component already exists at `components/DarkBreak.tsx`).
- **Code pointer:** `app/page.tsx` (the page composition); blocks rendered are `PillarCards` then `CommunitiesGrid`.

**P1-6. Privacy page references license numbers it doesn't show, footer also doesn't show them**
- **Page:** `/privacy`, footer (every page)
- **Viewport:** All
- **Description:** The Privacy page section "HOW I'M LICENSED" reads: "License numbers are listed in the site footer and on the About page." The About page does show all three (VA 0225231001, MD 5006551, DC SP40001379). But the footer ONLY says "Licensed in VA, MD & DC" with no actual numbers - the privacy text is inaccurate.
- **Recommendation:** Either add the three license numbers to the footer (under "Brokerage Office" or in the bottom compliance bar), or change the privacy copy to "License numbers are listed on the About page."
- **Code pointer:** `components/Footer.tsx` lines 65-72 (the licensed-in line). License numbers live in `lib/site.ts` lines 27-29 and `lib/content.ts` lines 168-170.

### P2 - Polish

**P2-1. Footer phone/email/social links are smaller than 44x44 tap targets on phone**
- **Page:** every page (global footer)
- **Viewport:** Phone 390x844
- **Description:** Footer "(703) 307-0889" link is 120x20, email link 249x20, brokerage phone 100x17, social icons 22x22, "PRIVACY & DISCLAIMERS" 164x16. None meet the WCAG 44x44 minimum. Height is the issue (line-height alone); horizontal width is usually fine. Visually they are clearly clickable, but a fat thumb can mis-tap.
- **Recommendation:** Wrap each in inline-block with `py-2.5` (or use `min-h-[44px] inline-flex items-center`) on phone only. For social icons, expand the hit area via `p-3 -m-3`.
- **Code pointer:** `components/Footer.tsx` lines 82-87 (phone/email), 109-114 (brokerage phone), 157-167 (socials), 182-187 (privacy link).

**P2-2. Header logo link height is 36px (< 44 tap minimum) on phone**
- **Page:** every page (header)
- **Viewport:** Phone 390x844
- **Description:** The logo `<Link>` measures 306x36 at phone. The 9 sm:11 md:12 sized portrait dot is fine, but the wordmark line-height makes the overall link 36px tall, under the 44 minimum.
- **Recommendation:** Add `min-h-[44px]` to the logo link, or increase the portrait dot to `w-11 h-11` at phone.
- **Code pointer:** `components/Logo.tsx` line 22.

**P2-3. Consent checkbox on contact form is 13x13 px on phone**
- **Page:** `/contact`
- **Viewport:** Phone 390x844
- **Description:** The consent checkbox inside the contact form measures 13x13 px (native size). While the wrapping label gives a larger touch area, the checkbox itself is far below 44x44.
- **Recommendation:** Add `w-5 h-5` to the checkbox, or wrap it in a larger accent-color custom box.
- **Code pointer:** `components/ContactForm.tsx` lines 70-74.

**P2-4. Leave-review star buttons are 28x28 on phone (< 44 minimum)**
- **Page:** `/leave-review`, `/leave-review-internal`
- **Viewport:** Phone 390x844
- **Description:** The 5-star rating buttons measure 28x28 px each on phone. Selecting a star requires precise aim.
- **Recommendation:** Increase star button size or add `p-2 -m-2` padding to extend hit area without changing visual size.
- **Code pointer:** `components/LeaveReviewForm.tsx`, `components/InternalFeedbackForm.tsx` (look for `text-amber-500` star buttons).

**P2-5. Body phone/email links on /contact page are 22 px tall**
- **Page:** `/contact`
- **Viewport:** Phone 390x844
- **Description:** The contact info block on /contact shows "(703) 307-0889" (135x22) and "realtor@shoukoufahomes.com" (280x22). Tappable but thin.
- **Recommendation:** Wrap in `inline-block min-h-[44px]` or add `py-2.5`.

**P2-6. Newsletter Subscribe button uses tight 0.32em tracking + thin text**
- **Page:** every page (footer)
- **Viewport:** All
- **Description:** Subscribe button reads as "SUBSCRIBE" at 0.32em / 0.7rem on a navy footer. Easily readable but the 43-pixel tall button could feel hesitant next to the bolder hero CTAs. Minor visual consistency note.
- **Recommendation:** Bump font weight to 400 or px size to 0.75rem in the footer Subscribe button.
- **Code pointer:** `components/Footer.tsx` line 150-153.

**P2-7. The brokerage office phone (703) 821-1840 has no label clarifying it's the brokerage line**
- **Page:** every page (footer)
- **Viewport:** All
- **Description:** Under "BROKERAGE OFFICE" block, after the address, a phone "(703) 821-1840" is shown without "Office" or "Brokerage" prefix. A user could call it expecting Shoukoufa to pick up.
- **Recommendation:** Prepend "Office: " or "Front desk: " to the brokerage number string in `lib/site.ts` (brokerageOffice.phone).

**P2-8. Header subline "Real Estate Specialist" duplicates the role line shown right under the wordmark on every viewport**
- **Page:** every page (header)
- **Viewport:** All
- **Description:** This is a typography hierarchy observation rather than a bug. The header wordmark + subline reads "SHOUKOUFA ABOUBAKRI / REAL ESTATE SPECIALIST". In hero blocks and footer the same role appears, so the subline is informationally redundant. On iPad it directly causes the clip in P1-1.
- **Recommendation:** Consider dropping the subline at the `md:` breakpoint and below (keeps the credential statement at desktop, removes the clip on tablet/phone).

---

## Patterns / cross-page observations

1. **The 820px breakpoint is the weakest viewport.** Most clipping issues live here because Tailwind's `md:` breakpoint kicks in at 768 (already large desktop-grade tracking/type), but the actual usable card widths drop to ~187-230 px in 2-col grids. The site is well-tuned for laptop and phone, less so for iPad portrait.

2. **Uppercase + wide letter-spacing is the consistent culprit.** Five of the six P1 bugs are wide-tracked uppercase strings (`0.28em-0.42em`) that overflow narrow containers. Consider a global pattern: any uppercase tracked text inside a card or constrained box gets a smaller tracking step (`md:tracking-[0.18em]` instead of `md:tracking-[0.32em]`) starting at the md breakpoint, with the looser tracking only kicking in at `xl` or `lg`.

3. **Tap targets are systematically under-sized at phone.** The footer phone/email/social pattern repeats on every page. Fixing the global footer pattern once will resolve 60-70% of all tap-target violations site-wide.

4. **Routing is solid.** No broken hrefs, no `#` placeholders, no 404s on the 19 routes tested. Header, mobile drawer, and footer all wire to the right places. The deep community pages all render their slug.

5. **No content debt.** Zero "samina" references, no lorem-ipsum, no "RE/MAX" (slash) anywhere on the public site, REMAX Galaxy (no slash) appears in the correct spots, the (703) 307-0889 phone is consistent everywhere, the brokerage office (703) 821-1840 appears only in the footer block (correct). Tagline "Building Legacies, One House at a Time" appears once on home hero (correct).

6. **Section rhythm is mostly good** but the home page has two cream-soft sections back-to-back (P1-5). Every other page alternates correctly.

7. **Forms are well-implemented.** Contact form has client-side validation, error state, transition pending state, and success state. Inputs are 53 px tall and full-width on phone. The only ergonomic concern is the consent checkbox (P2-3).

---

## Broken links

None found. Every link in header, footer, mobile drawer, and page content has a valid href.

| Page | Link text | href | Issue |
|---|---|---|---|
| (none) | - | - | - |

The only external links on the site are: three social icons in the footer (Instagram, Facebook, TikTok), and the Brand Bonjour credit in the bottom bar. All have valid https URLs.

---

## Tap-target violations (phone, < 44x44)

| Page | Element | Size | Recommendation |
|---|---|---|---|
| every page (header) | Logo link "SHOUKOUFA ABOUBAKRI" | 306x36 | Add `min-h-[44px]` to Logo link |
| every page (footer) | Phone link "(703) 307-0889" | 120x20 | Add `py-2.5` or `min-h-[44px]` |
| every page (footer) | Email link "realtor@shoukoufahomes.com" | 249x20 | Same |
| every page (footer) | Brokerage phone "(703) 821-1840" | 100x17 | Same |
| every page (footer) | Instagram icon | 22x22 | Add `p-3 -m-3` hit padding |
| every page (footer) | Facebook icon | 22x22 | Same |
| every page (footer) | TikTok icon | 22x22 | Same |
| every page (footer) | Privacy & Disclaimers link | 164x16 | Add `py-2 inline-block` |
| every page (footer) | Brand Bonjour copyright link | 340x28 | Add `py-2` (width fine) |
| /contact | Body phone link | 135x22 | Same |
| /contact | Body email link | 280x22 | Same |
| /contact | Consent checkbox | 13x13 | Add `w-5 h-5` |
| /leave-review, /leave-review-internal | 5x star rating buttons | 28x28 | Add `p-2 -m-2` |

---

## Overall impressions

**Laptop (1440x900):** The site is elegant and editorial. Type hierarchy is consistent, the navy/cream/transparent rhythm reads well, the hero video + glass-stat strip is a strong first impression. The single visible bug at this viewport is the CTA-text clipping inside the three home services cards (P1-2). Otherwise this is the strongest viewport.

**iPad (820x1180):** This is where most polish is missing. The header wordmark crowds the right edge, two community-card titles ("Alexandria", "Arlington") get cropped, and the small uppercase stat labels lose their last 1-2 letters. None of it breaks the layout, but the boutique-real-estate aesthetic the site is going for relies on precise type, and three text-clipping bugs at iPad portrait undermine that. Worth a focused tablet pass.

**Phone (390x844):** Surprisingly clean. No text overflows, no horizontal scroll, no layout breakage. The mobile drawer pattern works correctly, the menu is full-screen and the nav items inside the drawer are properly sized (72 px tall for top-level items, 32 px for sub-items - those sub-items are a tap-target concern). The only real ergonomic issue is the global pattern of underweight tap heights in the footer.

**Summary recommendation:** A small focused pass on the global header logo + footer link tap heights, plus a 30-min iPad-portrait pass to tighten letter-spacing inside cards, would lift the site from "good" to "polished" with no architectural change.
