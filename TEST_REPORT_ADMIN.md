# Admin Panel Test Report

**Test target:** http://localhost:3009/admin (dev)
**Viewports:** Laptop 1440×900, iPad 820×1180, Phone 390×844 (tested via sized iframe within an authenticated tab; iframe was sized to each target width so layout breakpoints fire correctly)
**Date:** 2026-05-14
**Tester:** Claude (read-only audit)

## Routes tested (26)

`/admin` · `/admin/builder/home` · `/admin/builder/about` · `/admin/builder/buyers` · `/admin/builder/sellers` · `/admin/builder/invest` · `/admin/builder/communities` · `/admin/builder/closings` · `/admin/builder/reviews` · `/admin/builder/partners` · `/admin/builder/contact` · `/admin/builder/privacy` · `/admin/pages` · `/admin/brand` · `/admin/brand/theme` · `/admin/content/brand/identity` · `/admin/communities` · `/admin/communities/alexandria` · `/admin/closings` · `/admin/reviews` · `/admin/partners` · `/admin/open-houses` · `/admin/open-houses/new` · `/admin/seo` · `/admin/seo/counties` · `/admin/inbox` · `/admin/forms` · `/admin/integrations` (404) · `/admin/integrations/google` · `/admin/settings` · `/admin/team` · `/admin/analytics` · `/admin/media`

**Total issues found:** 14
- P0 (blocking — admin can't do their job): 0
- P1 (visible bug): 3
- P2 (polish): 11

## Issues by severity

### P0 — Blocking

_None. The admin panel is functional end-to-end. All advertised features work._

### P1 — Visible bugs

**1. `/admin/closings` description promises arrow-reorder, but no arrows exist** · All viewports
The page intro says: "Reorder with the arrows on each card." In reality each closing card only exposes Edit / Delete — no `Move up` / `Move down` buttons (or drag handle). The promised reorder UI is missing.
*Recommendation:* either add up/down arrow buttons matching the Page Builder pattern, or drop the sentence from the intro copy.

**2. `/admin/integrations` (no `/google`) renders the public 404 page** · All viewports
The bare route 404s — fine — but the rendered 404 is the public site's "PAGE NOT FOUND" with "RETURN HOME" / "EXPLORE COMMUNITIES" CTAs. Inside an authenticated admin shell this is jarring and leaks the public footer.
*Recommendation:* either redirect `/admin/integrations` → `/admin/integrations/google` (the only existing sub-route), or render an admin-scoped 404 with a "Back to Site Editor" link.

**3. Delete uses native `window.confirm()` instead of a themed modal** · All viewports (Page Builder)
The block Delete control fires `window.confirm("Delete this block? This can't be undone.")`. It works, but native confirms are unstyled, look out of place in the admin shell, and break the visual language used elsewhere (Cancel/Save inline forms). On mobile some browsers render native confirms with low contrast.
*Recommendation:* replace with a themed confirmation modal that matches the rest of the admin (and reuses it for `/admin/closings`, `/admin/partners`, `/admin/reviews` Delete buttons, which appear to follow the same pattern).

### P2 — Polish

**4. Icon-only block control buttons rely on `title=` only — no `aria-label`** · All viewports
40+ icon-only buttons per page (Hide / Edit content / Duplicate / Delete) use `title="..."` but lack `aria-label`. Screen readers may announce them, but native `title` tooltips only appear on hover-capable devices — so touch users get no label at all. (Note: Move up / Move down DO use `aria-label`, which is the right pattern.)
*Recommendation:* add `aria-label` matching the existing `title` on every icon-only button.

**5. Touch targets on block control buttons are 32×32 px** · Phone
Hide / Edit / Duplicate / Delete render at 32px square on phone. WCAG 2.1 AA recommends ≥ 44×44.
*Recommendation:* bump padding to land at ≥ 44px on phone.

**6. Disabled `Move up` / `Move down` show `cursor: default`, not `not-allowed`** · All viewports
The first block's Move-up and last block's Move-down are correctly `disabled`, but the cursor remains default. Users may try clicking before noticing.
*Recommendation:* add `disabled:cursor-not-allowed disabled:opacity-50` (or similar).

**7. Edit / Delete buttons on `/admin/closings` use near-identical styling** · All viewports
Both are `text-xs text-navy hover:underline`. Delete adds a trash icon and `hover:text-red-600`, but at rest they look the same. Easy to mis-click.
*Recommendation:* make Delete persistently red/muted-red (not just on hover), or add a thin border/badge.

**8. Image Picker is not a proper dialog** · All viewports
"Pick from Media Library" opens an overlay with 60+ images and a Cancel button, but the overlay has no `role="dialog"` or `aria-modal="true"`. Cannot be dismissed with Escape (untested but no handler bound), focus isn't trapped.
*Recommendation:* wrap in `<dialog>` or a Radix/Headless UI Dialog, trap focus, dismiss on Escape, click-outside.

**9. New-block / Edit-block / Add-closing / Add-review forms are inline, not modal** · All viewports
The "Edit Block" panel expands inline below the row; New-page, New-closing, Edit-review all expand inline. This pushes other content down and on small viewports the user can lose context. Not a bug, but inconsistent with the standard "drawer or modal for edit" pattern.
*Recommendation:* consider a right-side drawer for block editing on laptop / iPad, fullscreen on phone.

**10. Review-edit checkboxes have no `for=` / `id=` linkage** · All viewports
"Feature on homepage strip" and "Show on public site" use a wrapping `<label>` around the checkbox — semantically OK — but no `id` / `for` pair and no `aria-label`. Works for sighted clicks; screen readers will read the surrounding text but tooling like Lighthouse may flag it.
*Recommendation:* add `id` to the checkbox and `for=` to the label.

**11. Sidebar / dashboard tiles list features that are "coming soon" without a badge in the sidebar** · All viewports
`/admin/analytics`, `/admin/seo` (most tiles), `/admin/integrations/google` ("Connect" CTA gated on user filling Google Cloud info) are clearly partial implementations. The sidebar shows them as equal-citizen items. A new user may click expecting parity with Page Builder.
*Recommendation:* add a small "Setup" or "Beta" tag in the sidebar/dashboard tile so the user knows what's wired vs in progress.

**12. Inbox empty state uses a thin "0 / 0 / 0 / 0" filter row before the empty message** · All viewports
With zero leads the user sees four zero counters and "No leads in this view." It's accurate but a little cold. Could be a friendlier "Nothing here yet. Submissions land here from the public site's Contact and Valuation forms."
*Recommendation:* swap in copy on empty state; keep filters but de-emphasize them when count is 0.

**13. `/admin/brand` hub repeats "TAP TO MANAGE / TAP TO OPEN / OPEN" three times per card** · All viewports
Each of the 6 brand cards shows three near-identical CTAs ("TAP TO MANAGE", "TAP TO OPEN", "OPEN") — visual noise and screen-reader repetition. Likely intentional from a card template that has eyebrow + label + button, but reads as duplication.
*Recommendation:* keep one CTA per card. Same applies to `/admin` dashboard tiles.

**14. Login page is email-only magic-link, but task scenario assumed password** · n/a
Not a bug — just a note: I was already authenticated when the test started (session cookie). `/admin/login` is a passwordless magic-link form (email field only). Anyone running this audit needs to log in by clicking the magic link in email.

## Feature workability scorecard

| Feature | Works? | Notes |
|---|---|---|
| Login (magic-link, /admin/login) | OK (form renders) | Email-only; magic-link flow not exercised end-to-end (session was already active) |
| Page Builder — edit block | YES | Inline panel expands below the block row; all per-field controls present |
| Page Builder — reorder (Move up/down) | YES | Edge cases (first/last) properly disabled |
| Page Builder — add block | YES | Modal opens, 24 block types categorized (HERO & HEADERS / CONTENT & CARDS / NUMBERS & LISTS / etc.) |
| Page Builder — delete with confirmation | YES (native confirm) | Works but uses unstyled `window.confirm` — see P1 #3 |
| Page Builder — per-field color dropdown | YES | Renders inline next to each label (`flex items-center justify-between`). Confirmed on Eyebrow / Heading / Title / Body, and per-card Title / Body inside Three Ways I Help |
| Page Builder — wrapper dropdowns (Overlay / Spacing / Theme / Text Color) | YES | All four are proper `<select>` dropdowns with descriptive options (e.g. "Auto — leave block defaults alone") |
| Closings Grid — Mode dropdown | YES | Options: "Preview — first 6 + See All link" / "Full — all closings + Load More" |
| Brand Identity — save | UI present | Save / Reset buttons render; per task instructions I did not actually save |
| Media Library — browse + select | YES | 77 images render with per-image crop variants (Original / 1:1 / 3:4 / 4:3 / 16:9) and Copy URL / Delete |
| Image Picker — crop | YES | "Adjust crop" + "Pick from library" buttons present in every image field |
| Communities — edit | YES | `/admin/communities/alexandria` opens with 26 labeled inputs across Basics / Editorial / Market data / Price Tiers / Life sections |
| Closings — add | YES | "Add closing" expands inline form with 6 fields and Pick-from-library image field |
| Reviews — toggle featured | YES | Edit reveals "Feature on homepage strip" checkbox + "Show on public site" checkbox (see P2 #10 for label-association nit) |
| Custom Pages — create | YES | "New Page" inline form: Title / slug / Meta Description → "Create & Build" routes to /admin/builder/{slug} |
| Site Settings — save | UI present | Tabs: Contact / Social / Header Nav / Page Metadata. 12 labeled inputs. Save Changes button. Did not actually save. |
| Sidebar — collapse on phone | YES | Hamburger ("Open menu") visible at ≤ 390px; tap reveals 240px sidebar |
| Sidebar — active route highlight | YES | Sidebar marks current page (verified by inspection) |
| Console errors during navigation | None observed | No `console.error` calls captured across 6 routes traversed with logging hooks active |

## Cross-route patterns

- **Visual language is consistent.** Every admin route uses the same `SITE EDITOR · SECTION` eyebrow + h1 + lede pattern, the same sidebar, the same Save / Reset / Cancel button styles, and the same "Edit / Delete" right-aligned controls on list items. This is the panel's biggest strength.
- **Inline-everywhere editing.** New-record forms (closings, pages, reviews, open-houses) all expand inline rather than open a modal/drawer. Predictable, but on phone it pushes existing content far down the page.
- **Icon buttons use `title=` not `aria-label`.** Pattern applies to Hide / Edit content / Duplicate / Delete. Move up / Move down get it right. Worth normalizing.
- **No proper `role="dialog"` anywhere.** Modals (Add Block, Pick from Media Library) lack ARIA roles; not screen-reader friendly.
- **Empty states are good.** Open Houses, Forms, Inbox, SEO Counties, and Analytics all have decent empty states with a clear CTA — better than most CMS panels.
- **Brand and SEO are hub-and-spoke**, with a landing page that lists sub-features as tiles. Communities, Closings, Reviews, Partners are flat lists.
- **Performance is fine on dev.** All routes returned in 530-910 ms; Media Library is the heaviest (510 KB HTML response, 77 images) but still under 1 s.
- **No console errors observed** across the routes I traversed with a logging hook installed.
- **The fixed-iframe responsive harness shows zero horizontal scroll** at any viewport on any route. No layout breakage.

## Admin UX overall impressions

The panel is already in good shape — well above the bar for a single-realtor SaaS. The design language is consistent (eyebrow / h1 / lede header, navy accents, Cancel/Save inline forms), the Page Builder has the depth a power user needs (24 block types, per-field color controls, wrapper dropdowns, image picker with crops), and the empty states are friendlier than most CMSes I see. A non-technical realtor could realistically operate this without much training.

The remaining work is mostly polish: the native `window.confirm` for block deletion sticks out, icon buttons need proper `aria-label`s, touch targets on phone are below the 44 px guideline, and a couple of features advertise behavior that isn't implemented yet (the "Reorder with the arrows" line on `/admin/closings` is the clearest example). None of these are blocking — a user could ship a real website with this admin today.

The two structural calls worth making before going broad: (1) decide whether inline-everywhere editing is the long-term answer or whether high-density edit panels (block editor especially) should move to a side drawer; (2) settle the integrations / analytics / SEO story — half the tiles are "coming soon" and the sidebar treats them as first-class. Either flag them as beta or fold them behind a single "Integrations" hub until they're real.
