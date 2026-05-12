# Samina Bilal — Realtor Website

Boutique luxury real estate website for **Samina Bilal**, licensed Realtor with **RE/MAX Galaxy** in Virginia and Maryland.

Live: _coming soon_

---

## Stack

- **Next.js 16** (App Router, SSG)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3** with custom design tokens
- **Montserrat** (single typeface system, weights 200/300/400)
- **Lucide** icons

## Design system

Editorial / boutique luxury aesthetic inspired by Carolwood Estates:
- Warm cream background (`#F2EFEA`) with deep oxblood accent (`#3B1418`)
- Multi-tier frosted-glass utilities (`glass-dark`, `glass-light`, `glass-mid`, `glass-pill`)
- Single-font system in 3 weights — display thin, ultra-wide tracking on uppercase
- Generous editorial spacing: section padding `clamp(8rem, 16vw, 14rem)`
- Composited photo overlays so text always reads cleanly

## Pages (14)

| Route | Purpose |
|---|---|
| `/` | Hero video · stats · pillars · communities · path teaser · closings · reviews |
| `/about` | Bio · practice areas · credentials |
| `/communities` | 6 neighborhoods + 2026 comparison table |
| `/communities/[slug]` | Per-neighborhood detail (Woodbridge, Dumfries, Ashburn, Lorton, Stafford, Manassas) |
| `/path-to-ownership` | 12–24 month renter-to-owner program · FAQ |
| `/closings` | Recently sold gallery (6-up + Load More) |
| `/sellers` | Home valuation form |
| `/reviews` | Client testimonials |
| `/contact` | Form + direct details |
| `/sitemap.xml`, `/robots.txt`, custom `404` | SEO |

## Local development

```bash
npm install
npm run dev    # → http://localhost:3008
```

## Production build

```bash
npm run build
npm start
```

## Single source of truth

Site-wide content lives in:

| File | Contents |
|---|---|
| `lib/site.ts` | Brand info, contact, license #s, social, navigation |
| `lib/communities.ts` | Six neighborhoods + 2026 market data + editorial copy |
| `lib/closings.ts` | Recent closings gallery items |
| `lib/reviews.ts` | Client reviews + ratings |

Edit one file → updates everywhere.

## Deployment

Configured for **Netlify** (also Vercel-compatible).

---

© Samina Bilal · RE/MAX Galaxy · Equal Housing Opportunity
