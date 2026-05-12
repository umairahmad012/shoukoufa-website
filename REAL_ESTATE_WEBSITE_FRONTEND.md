# Real Estate Website Frontend — Complete Specification

**Project:** Samina Bilal · Realtor — Boutique luxury real estate site
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3
**Aesthetic:** Editorial luxury, Carolwood-inspired. Cream + navy palette, single-typeface system, full-bleed photography, deliberate whitespace, restrained motion.

This document is the complete frontend spec. An AI agent, given this document and the content data files (`lib/site.ts`, `lib/content.ts`, `lib/communities.ts`, `lib/closings.ts`, `lib/reviews.ts`), should be able to reproduce the site exactly.

---

## Table of Contents

1. [Tech Stack & Tooling](#1-tech-stack--tooling)
2. [Project Structure](#2-project-structure)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing & Layout System](#5-spacing--layout-system)
6. [Frosted Glass System](#6-frosted-glass-system)
7. [Photo Overlays](#7-photo-overlays)
8. [Buttons](#8-buttons)
9. [Animation System](#9-animation-system)
10. [Border Shine Effect](#10-border-shine-effect)
11. [Shimmer Text Effect](#11-shimmer-text-effect)
12. [Reveal Animations](#12-reveal-animations)
13. [Counter Animation](#13-counter-animation)
14. [Stacked Cards Effect](#14-stacked-cards-effect)
15. [Section Rhythm Rules](#15-section-rhythm-rules)
16. [Components](#16-components)
17. [Pages](#17-pages)
18. [Navigation Patterns](#18-navigation-patterns)
19. [Image Conventions](#19-image-conventions)
20. [Content & Voice Rules](#20-content--voice-rules)
21. [Build / Bundler Quirks](#21-build--bundler-quirks)
22. [Deployment](#22-deployment)
23. [Replication Checklist](#23-replication-checklist)

---

## 1. Tech Stack & Tooling

### Core
- **Next.js**: `^16.2.4` (App Router with Turbopack)
- **React**: `^19.2.5`
- **React DOM**: `^19.2.5`
- **TypeScript**: `^5.6.2` (strict mode)

### Styling
- **Tailwind CSS**: `^3.4.13` (NOT v4)
- **PostCSS**: `^8`
- **Autoprefixer**: `^10.4.20`
- **Lightningcss** (built into Next.js Turbopack — see Section 21 for backdrop-filter quirk)

### Utilities
- `clsx`: `^2.1.1` (className composition)
- `tailwind-merge`: `^2.5.2` (resolve conflicting Tailwind classes)
- `lucide-react`: `^0.446.0` (icon set — `Search`, `Menu`, `X`, `ChevronDown`, `ArrowUpRight`, `Phone`, `Mail`, `MapPin`, `Clock`, `Instagram`, `Facebook`, `Music2`, `GraduationCap`, `Trees`, `UtensilsCrossed`, `Train`, `Compass`, `ShieldCheck`, `Users`, `HandCoins`, `ClipboardCheck`, `Home`, `Key`, `FileSignature`, `TrendingUp`, `Eye`, `Handshake`, `Calculator`, `Camera`, `Megaphone`, `Tag`)

### NPM Scripts
```json
{
  "dev": "next dev -p 3008",
  "build": "next build",
  "start": "next start -p 3008",
  "lint": "next lint"
}
```

### Browserslist (in `package.json`)
```json
"browserslist": [
  "last 2 Chrome versions",
  "last 2 Safari versions",
  "last 2 Firefox versions",
  "last 2 Edge versions"
]
```
This targets only modern browsers — autoprefixer skips obsolete prefixes that would otherwise bury our `backdrop-filter` declarations.

---

## 2. Project Structure

```
samina-website/
├── app/
│   ├── globals.css                    # design system CSS (510 lines)
│   ├── layout.tsx                     # root layout (Header + Footer wrap)
│   ├── page.tsx                       # homepage
│   ├── not-found.tsx                  # 404
│   ├── sitemap.ts                     # auto-generated sitemap.xml
│   ├── robots.ts                      # auto-generated robots.txt
│   ├── about/page.tsx
│   ├── buyers/page.tsx
│   ├── sellers/page.tsx
│   ├── path-to-ownership/page.tsx
│   ├── communities/
│   │   ├── page.tsx                   # overview + comparison table
│   │   └── [slug]/page.tsx            # 6 community detail pages (SSG)
│   ├── closings/page.tsx
│   ├── partners/page.tsx              # trusted partner network
│   ├── reviews/page.tsx
│   └── contact/page.tsx
│
├── components/
│   ├── Header.tsx                     # sticky transparent → cream on scroll
│   ├── Logo.tsx                       # circular portrait + name + role
│   ├── MenuDrawer.tsx                 # slide-in nav drawer (right side)
│   ├── Footer.tsx                     # navy footer with brokerage card
│   ├── Hero.tsx                       # homepage hero with video + glass stat strip
│   ├── PageHero.tsx                   # standard inner-page hero
│   ├── IntroSection.tsx               # "Meet Samina" 2-col with portrait
│   ├── PillarCards.tsx                # 3 service cards (Buy/Sell/Path)
│   ├── CommunitiesGrid.tsx            # 6-tile community grid
│   ├── PathTeaser.tsx                 # path-to-ownership homepage CTA
│   ├── ClosingsGallery.tsx            # 6-up gallery with Load More
│   ├── ReviewsStrip.tsx               # 3 glass review cards + ratings
│   ├── DarkBreak.tsx                  # full-bleed dark photo interstitial
│   ├── ShimmerText.tsx                # one-shot or looping shimmer headings
│   ├── Reveal.tsx                     # IntersectionObserver fade-up wrapper
│   ├── Counter.tsx                    # ease-out counting animation
│   ├── StackedCards.tsx               # sticky-pin process card stack
│   └── SectionTitle.tsx               # reusable section header (legacy)
│
├── lib/
│   ├── site.ts                        # brand metadata + nav + portrait paths
│   ├── content.ts                     # ALL on-page copy (single source of truth)
│   ├── communities.ts                 # 6 community detail data
│   ├── closings.ts                    # closing gallery data
│   ├── reviews.ts                     # client reviews
│   ├── cn.ts                          # clsx + tailwind-merge wrapper
│   └── useReveal.ts                   # IntersectionObserver hook
│
├── public/
│   ├── images/
│   │   ├── Samina Headshot.jpeg       # her real photo
│   │   └── remax-galaxy-logo.png      # placeholder for brokerage logo
│   ├── closings/                      # closing photos
│   └── videos/                        # hero videos
│
├── package.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── tsconfig.json
├── netlify.toml
├── vercel.json
└── .gitignore
```

---

## 3. Color System

The palette is intentionally limited to four colors plus alpha variants.

### Tailwind Tokens (`tailwind.config.ts`)
```ts
colors: {
  cream:       "#F2EFEA",  // page background — warm linen, not pure white
  "cream-soft": "#EDE9E2",  // alternate light bg for section rhythm
  navy: {
    DEFAULT:   "#142840",   // accent: buttons, dividers, glow on icons
    dark:      "#0E1C30",   // CTAs hover, hero/footer dark backgrounds
    light:     "#25406A",   // rarely used — currently unused in pages
  },
  ink:         "rgba(0, 0, 0, 0.82)",  // body type
  "ink-muted": "rgba(0, 0, 0, 0.55)",  // small caps, supporting text
  "ink-subtle":"rgba(0, 0, 0, 0.35)",  // disabled / hint copy
  "ink-on-dark": "rgba(255, 255, 255, 0.95)",
}
```

### Where Each Color Is Used

| Color | Hex/RGBA | Used For |
|---|---|---|
| `cream` | `#F2EFEA` | Body/html background, default light section bg |
| `cream-soft` | `#EDE9E2` | Alternate section bg (creates subtle rhythm in light stretches) |
| `navy` | `#142840` | Brand accent — dividers, eyebrow underlines, footer bg, drawer bg, solid CTA bg |
| `navy-dark` | `#0E1C30` | Hero placeholder bg, CTA hover state |
| `navy-light` | `#25406A` | Currently unused (reserved) |
| `white` | `#FFFFFF` | Text on dark, gold border-shine peak |
| `rgba(0,0,0,0.78)` | body text base color | Default `<p>` |
| `rgba(0,0,0,0.82)` | `text-ink` | Dark headings on cream |
| `rgba(0,0,0,0.55)` | `text-ink-muted` | Eyebrow text on cream |
| `rgba(0,0,0,0.35)` | `text-ink-subtle` | Italic disclaimers |
| `rgba(255,255,255,0.95)` | `text-white` | Headings on dark photo |
| `rgba(255,255,255,0.85)` | secondary white text | Body copy in dark sections |
| `rgba(255,255,255,0.7)` | tertiary white | Eyebrows on dark |
| `rgba(255,255,255,0.4–0.55)` | hairline dividers on dark | `bg-white/40` |
| `rgba(20,40,64, X)` | navy-tinted shadows | Card box-shadows on light bg |
| Gold (champagne): `rgba(255, 245, 205, 1)` peak / `rgba(255, 215, 130, 0.4)` falloff | Border-shine on glass cards | See Section 10 |

### Forbidden Colors

- ❌ Pure white (`#FFFFFF`) as page background — use `cream` instead
- ❌ Any saturated brand color (red, green, blue) outside of navy
- ❌ Original "oxblood" `#3B1418` — fully replaced by navy in this site (legacy reference only)

---

## 4. Typography System

### Font Family
**Single typeface throughout the entire site:** Montserrat (loaded via `next/font/google`).

```ts
// app/layout.tsx
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-montserrat",
  display: "swap",
});
```

CSS variable: `--font-montserrat`. Tailwind references it via:
```ts
fontFamily: { sans: ["var(--font-montserrat)", "system-ui", "sans-serif"] }
```

### Font Weights Used
| Weight | Name | Where |
|---|---|---|
| 200 | Thin | Hero H1 (display), counter numbers, big stat figures, monogram letter |
| 300 | Light | Body paragraphs, italic quotes, footer copy |
| 400 | Regular | Section H2 titles, eyebrows, CTA buttons (after weight bump from 300) |
| 500 | Medium | Reserved (unused currently) |

### Type Scale

```css
/* HERO H1 — display */
.heading-display {
  font-weight: 200;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.04;
  /* size set inline: clamp(3rem, 8vw, 6.5rem) for homepage hero;
     clamp(2.5rem, 7vw, 5.5rem) for inner page heroes */
}

/* SECTION H2 */
.heading-section {
  font-weight: 400;          /* bumped from 300 for weight/presence */
  letter-spacing: 0.10em;
  text-transform: uppercase;
  line-height: 1.18;
  /* size set inline: clamp(1.6rem, 3vw, 2.25rem) */
}

/* EYEBROW (small caps above headings) */
.eyebrow {
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.32em;     /* very wide — editorial small caps */
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);
}

.eyebrow-light {
  /* same but for dark backgrounds */
  color: rgba(255, 255, 255, 0.7);
}
```

### Body Type

```css
html, body {
  font-family: var(--font-montserrat);
  font-weight: 300;           /* light */
  letter-spacing: 0.015em;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

p {
  font-weight: 300;
  line-height: 1.85;          /* 1.85 — editorial breathing room */
  letter-spacing: 0.012em;
}
```

### Typography Rules

1. **Headings: always uppercase, always tracked wide.** Letter-spacing scale: 0.06em (hero H1) → 0.10em (section H2) → 0.32em (eyebrow). Big text gets less letter-spacing, small text gets more.
2. **Body paragraphs: light (300), line-height 1.85.** Never tighten.
3. **Italic for pull-quotes only** — used for Samina's quoted lines, review blockquotes, and "guided by Samina Bilal" callouts in the hero.
4. **Numbers in counters/stats: weight 200, slightly tracked.** `style={{ fontWeight: 200, letterSpacing: "0.04em" }}`.
5. **Hairline dividers** between heading and body — `<div className="w-12 h-px bg-navy/40" />`. Width 12 (3rem), height 1px, color is navy at 40% alpha (or white at 40% on dark).

---

## 5. Spacing & Layout System

### CSS Custom Properties (in `:root`)
```css
:root {
  --section-y: clamp(6rem, 12vw, 11rem);     /* standard vertical rhythm: 96–176px */
  --section-y-lg: clamp(8rem, 16vw, 14rem);  /* large vertical rhythm: 128–224px */
  --gutter-x: clamp(1.5rem, 5vw, 4rem);      /* horizontal gutter: 24–64px */
}

.section-y { padding-top: var(--section-y); padding-bottom: var(--section-y); }
.section-y-lg { padding-top: var(--section-y-lg); padding-bottom: var(--section-y-lg); }
.gutter-x { padding-left: var(--gutter-x); padding-right: var(--gutter-x); }
```

### Container Widths
- Section header columns: `max-w-3xl` (~768px) → text width
- Section body grids: `max-w-[1500px]` (1500px) — full editorial spread
- Both centered with `mx-auto`. Header sits inside grid container so they align horizontally.

### Standard Section Pattern
```jsx
<section className="section-y-lg gutter-x bg-cream-soft">
  <div className="max-w-[1500px] mx-auto">
    <div className="max-w-3xl mx-auto text-center mb-20 md:mb-28">
      {/* Header: eyebrow → heading → divider → optional subtitle */}
      <p className="eyebrow mb-8">Eyebrow</p>
      <h2 className="heading-section text-ink mb-10" style={{ fontSize: "clamp(1.6rem, 3vw, 2.25rem)" }}>
        Section Heading
      </h2>
      <div className="mx-auto mb-10 w-12 h-px bg-navy/40" />
      <p className="text-base md:text-lg font-light leading-[1.9] text-ink/70 max-w-2xl mx-auto">
        Optional subtitle paragraph
      </p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch">
      {/* card grid */}
    </div>
  </div>
</section>
```

### Grid Gap Standards
- Cards: `gap-8 md:gap-10` (32px → 40px)
- Stat strips: no gap, hairline dividers between
- Communities grid: `gap-8 md:gap-10`

### Margin Spacing Within Headers
- eyebrow → h2: `mb-8` (32px)
- h2 → divider: `mb-10` (40px)
- divider → subtitle: implicit via `mb-10` on divider
- subtitle → grid: `mb-20 md:mb-28` (80px → 112px)

---

## 6. Frosted Glass System

Four variants. All use a CSS custom property `--frost` to bypass bundler optimization that would strip the unprefixed `backdrop-filter` (see Section 21).

### `.glass-dark` — Used 80% of the time
Dark frosted card. Default for hero stat strips, info overlays on photo cards, dark-section panels.

```css
.glass-dark {
  --frost: blur(16px) saturate(140%);
  background: rgba(0, 0, 0, 0.28);              /* translucent black — image bleeds through */
  -webkit-backdrop-filter: var(--frost);
  backdrop-filter: var(--frost);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),    /* inner top hairline */
    0 30px 60px -20px rgba(0, 0, 0, 0.45);      /* soft drop */
}
```

**Tuning notes:**
- Background opacity 0.28 = clearly dark but image readable. NOT 0.45+ (smothers the photo) and NOT 0.10 (no presence).
- Blur 16px = "gently softened, photo recognizable" — NOT 70px+ (obliterates).
- Saturation 140% = subtle color richness boost.

### `.glass-light` — On cream backgrounds
Lifts cards off cream backgrounds.
```css
.glass-light {
  --frost: blur(48px) saturate(190%);
  background: rgba(255, 255, 255, 0.45);
  -webkit-backdrop-filter: var(--frost);
  backdrop-filter: var(--frost);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 24px 60px -24px rgba(20, 40, 64, 0.18);
}
```

### `.glass-mid` — Bright/varied photos, softer
```css
.glass-mid {
  --frost: blur(44px) saturate(170%);
  background: rgba(255, 255, 255, 0.10);
  -webkit-backdrop-filter: var(--frost);
  backdrop-filter: var(--frost);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 24px 60px -20px rgba(0, 0, 0, 0.35);
}
```

### `.glass-pill` — Small tags
Used for "SOLD" pills, "BETA" tags.
```css
.glass-pill {
  --frost: blur(28px) saturate(190%);
  background: rgba(255, 255, 255, 0.16);
  -webkit-backdrop-filter: var(--frost);
  backdrop-filter: var(--frost);
  border: 1px solid rgba(255, 255, 255, 0.35);
}
```

### Critical: Positioning Override
All glass classes use `:where()` for the `position: relative` default so Tailwind's `.absolute` utility wins:
```css
:where(.glass-light, .glass-dark) {
  position: relative;     /* default — needed for ::before border-shine */
  isolation: isolate;     /* new stacking context */
}
```
This means: glass cards default to `position: relative`. Add `class="absolute"` and Tailwind wins.

### Border Shine Layer
Every `.glass-light` and `.glass-dark` automatically gets two `::before` and `::after` pseudo-elements creating the moving golden shine. See Section 10.

---

## 7. Photo Overlays

Three composited overlay utilities for putting white text over photos:

### `.overlay-hero` — Hero sections
Strong vignette + bottom gradient. Used on every page hero.
```css
.overlay-hero {
  background:
    radial-gradient(ellipse at center,
      rgba(0,0,0,0.05) 0%,
      rgba(0,0,0,0.25) 55%,
      rgba(0,0,0,0.55) 100%),
    linear-gradient(to bottom,
      rgba(0,0,0,0.35) 0%,
      rgba(0,0,0,0.10) 30%,
      rgba(0,0,0,0.30) 70%,
      rgba(0,0,0,0.78) 100%);
}
```

### `.overlay-card` — Photo cards (Pillars, Communities, Closings)
Bottom-weighted darken so glass info card pops.
```css
.overlay-card {
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.18) 0%,
    rgba(0,0,0,0.05) 35%,
    rgba(0,0,0,0.20) 60%,
    rgba(0,0,0,0.85) 100%
  );
}
```

### `.overlay-left-fade` — Path Teaser
Left-anchored navy fade so glass card on the left reads.
```css
.overlay-left-fade {
  background: linear-gradient(
    to right,
    rgba(10, 16, 28, 0.85) 0%,
    rgba(10, 16, 28, 0.55) 50%,
    rgba(10, 16, 28, 0.20) 100%
  );
}
```

---

## 8. Buttons

Four button styles. All share: `1.2rem 2.6rem` padding, `0.28em` letter-spacing (opens to `0.32em` on hover), `0.72rem` font size, `300` font-weight, uppercase, 500ms editorial transition.

### `.btn-solid` — Primary (navy)
```css
background: #142840;          /* navy */
color: white;
border: 1px solid #142840;
/* hover: bg #0E1C30 (navy-dark), letter-spacing 0.32em */
```

### `.btn-outline-dark` — Secondary on light bg
```css
background: transparent;
color: #142840;
border: 1px solid #142840;
/* hover: bg #142840, color white */
```

### `.btn-outline-light` — On dark bg
```css
background: rgba(0, 0, 0, 0.55);     /* black-frosted */
backdrop-filter: blur(28px) saturate(170%);
color: white;
border: 1px solid rgba(255, 255, 255, 0.6);
/* hover: bg white, color navy */
```

### `.btn-glass` — Hero CTAs
Same as `.btn-outline-light` but slightly lighter border (`rgba(255,255,255,0.45)`).

### Hover Pattern (universal)
- Background swaps to opposite tone
- Letter-spacing increases from `0.28em` → `0.32em` (subtle "stretch" sign of life)
- Transition: `0.5s cubic-bezier(0.22, 1, 0.36, 1)`

---

## 9. Animation System

### Editorial Easing
Every transition uses the same cubic-bezier:
```css
--ease-editorial: cubic-bezier(0.22, 1, 0.36, 1);
```
Defined as Tailwind's `transitionTimingFunction.editorial`. Subtle ease-out — fast at start, settles slowly. The signature feel of the site.

### Animation Categories

| Effect | Component / Class | Trigger | Speed |
|---|---|---|---|
| Hero fade-in-up | `.animate-fade-in-up` | Page load | 800ms |
| Hero fade-in | `.animate-fade-in` | Page load | 1000ms |
| Reveal (scroll) | `<Reveal>` component | IntersectionObserver | 900ms |
| Counter | `<Counter>` component | IntersectionObserver | 2.2s ease-out |
| Shimmer text | `<ShimmerText>` component | Auto-loop | 2.6s + 4s pause |
| Border shine | CSS `@keyframes shine-cw` / `shine-ccw` | Auto-loop | 18s linear |
| Stacked cards | `<StackedCards>` component | Scroll-driven | 700ms class swap |
| Icon hover glow | CSS `:hover svg` | Hover | 400ms |
| Card scale on hover | inline `group-hover:scale-[1.05]` | Hover | 1400ms |

---

## 10. Border Shine Effect

Two golden highlights orbiting in opposite directions on every glass card.

### Implementation

Two CSS custom properties registered with `@property`:
```css
@property --shine-a {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@property --shine-b {
  syntax: "<angle>";
  inherits: false;
  initial-value: 180deg;
}
```

Two pseudo-elements per glass card:
```css
.glass-light::before,
.glass-light::after,
.glass-dark::before,
.glass-dark::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  padding: 1px;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
          mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
}

.glass-dark::before {
  background: conic-gradient(
    from var(--shine-a),
    transparent 0deg,
    transparent 305deg,
    rgba(255, 215, 130, 0.4) 325deg,    /* champagne soft */
    rgba(255, 240, 195, 1) 350deg,       /* cream peak */
    rgba(255, 215, 130, 0.4) 358deg,
    transparent 360deg
  );
  animation: shine-cw 18s linear infinite;
}

.glass-dark::after {
  /* same gradient but driven by --shine-b */
  animation: shine-ccw 18s linear infinite;
}

@keyframes shine-cw  { to { --shine-a: 360deg; } }
@keyframes shine-ccw { to { --shine-b: -180deg; } }
```

### How It Works
1. The pseudo-elements are clipped to the 1px border ring via XOR mask composition.
2. A conic-gradient is rendered inside that ring.
3. The bright slice is a 53° arc (305°→358°) with a peak at 350°.
4. The `from` angle of each gradient is animated via `@property` — smooth interpolation requires registered properties.
5. Two passes, opposite directions, starting 180° apart so they alternate around the perimeter and briefly meet at the right/left sides.

### Visual Result
Slow, restrained champagne-gold highlights gliding around every glass card edge. Feels like sunlight running over polished metal. ~18-second loop.

---

## 11. Shimmer Text Effect

A black wipe sweeps across white H1 text on every page hero. Pure CSS — no animation library.

### Implementation

```css
@keyframes shimmer-sweep {
  0%   { background-position: -110% center; }
  60%  { background-position: 260% center; }
  100% { background-position: 260% center; }
}
```

The 60–100% pause means: sweep takes 60% of the loop, then pauses 40% before restarting.

### Component (`components/ShimmerText.tsx`)

```tsx
export function ShimmerText({
  children,
  tone = "dark",     // "dark" = white text on dark bg; "light" = dark text on cream
  duration = 2.6,    // sweep duration (animation total = duration + 4s pause)
  delay = 0.5,       // delay after mount
}) {
  const contrast =
    tone === "light" ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.85)";

  return (
    <span style={{
      WebkitTextFillColor: "transparent",
      backgroundColor: "currentColor",
      backgroundImage: `linear-gradient(to right,
        currentColor 0%,
        ${contrast} 45%,
        ${contrast} 55%,
        currentColor 100%)`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      backgroundRepeat: "no-repeat",
      backgroundSize: "60% 200%",
      backgroundPosition: "-110% center",
      animation: `shimmer-sweep ${duration + 4}s ease-in-out ${delay}s infinite`,
    }}>
      {children}
    </span>
  );
}
```

### How It Works
1. Text fill is transparent.
2. A linear gradient (text → black band → text) is clipped to the text shape.
3. The gradient is 60% wide. Animating background-position translates the gradient horizontally.
4. The black band sweeps left-to-right across the letters, momentarily wiping them dark, then revealing them again.

### Usage
```tsx
<h1 className="heading-display text-white">
  <ShimmerText delay={1.2}>
    Make Yourself<br />at Home
  </ShimmerText>
</h1>
```

Used on every page hero H1: Homepage hero, About, Buyers, Sellers, Path-to-Ownership, Communities (all 6 detail pages), Closings, Reviews, Contact, Partners, 404. PageHero component uses `tone="light"` because its text is dark on cream.

---

## 12. Reveal Animations

IntersectionObserver-driven fade/slide/blur on scroll.

### Hook (`lib/useReveal.ts`)
```ts
export function useReveal({ threshold = 0.18, rootMargin = "0px 0px -10% 0px" } = {}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ref.current || revealed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();      // one-shot per page load
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [revealed, threshold, rootMargin]);

  return { ref, revealed };
}
```

### CSS
```css
.reveal {
  opacity: 0;
  transition:
    opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 900ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 900ms cubic-bezier(0.22, 1, 0.36, 1);
}

.reveal-up    { transform: translateY(45px); }
.reveal-blur  { filter: blur(10px); }
.reveal-left  { transform: translateX(-55px); }
.reveal-right { transform: translateX(55px); }

@media (max-width: 767px) {
  .reveal-left, .reveal-right { transform: translateY(45px); }  /* mobile fallback */
}

.is-revealed {
  opacity: 1;
  transform: none;
  filter: none;
}
```

### Component (`components/Reveal.tsx`)
Two modes:
1. **Wrapper mode (default):** `<Reveal as="p">...</Reveal>` renders a wrapper `<p>` with reveal classes.
2. **`asChild` mode:** `<Reveal asChild>...</Reveal>` merges classes onto the only element child via `cloneElement`. **Critical** for cards with absolutely-positioned descendants — if Reveal had a `transform` on a wrapping `div`, those absolute children would anchor to the wrapper's containing block instead of the card.

### Stagger Pattern
```jsx
<Reveal as="p" className="eyebrow mb-8">{eyebrow}</Reveal>
<Reveal as="h2" delay={80} className="heading-section">{heading}</Reveal>
<Reveal as="div" delay={160} className="w-12 h-px bg-navy/40" />
<Reveal as="p" delay={240} blur className="...">{paragraph}</Reveal>
```
80ms staggered intervals create an "orchestrated" entrance.

### Direction Picking
For cards in a grid:
- Left card: `direction="left"` (slides in from left)
- Center card: `direction="up"` (rises from below)
- Right card: `direction="right"` (slides in from right)

Replicated across PillarCards, CommunitiesGrid (left/right alternating per row), ClosingsGallery (left/up/right cycling per column).

---

## 13. Counter Animation

Counts numerical stats from 0 → target value when scrolled into view.

### Component (`components/Counter.tsx`)

```tsx
export function Counter({
  to, decimals, prefix = "", suffix = "",
  duration = 2.2,
}) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        observer.disconnect();
        // animate via requestAnimationFrame, ease-out cubic
        const start = performance.now();
        const ms = duration * 1000;
        function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
        function tick(now) {
          const t = Math.min((now - start) / ms, 1);
          setValue(to * easeOut(t));
          if (t < 1) requestAnimationFrame(tick);
          else setValue(to);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    observer.observe(ref.current);
  }, [to, duration]);

  const decimalsToUse = decimals ?? (Number.isInteger(to) ? 0 : 1);
  return <span>{prefix}{value.toFixed(decimalsToUse)}{suffix}</span>;
}
```

### Where Used
- Hero stat strip: `5.0★`, `42+`, `2`
- Path-to-Ownership stats: `$0`, `12–24`, `2`
- ReviewsStrip aggregate ratings: `5.0` × 3 sources

### Format Rules
- Suffixes (`★`, `+`, `%`) are static — only the digits animate
- Decimals auto-detected if not provided
- Trigger threshold: 0.4 (must be ~40% in viewport)

---

## 14. Stacked Cards Effect

Sticky-pin sequence used on `/path-to-ownership` for the 4-step process.

### Component (`components/StackedCards.tsx`)

```tsx
<StackedCards>
  {steps.map(s => <div key={s.n}>{step content}</div>)}
</StackedCards>
```

Wraps each child in `.stacked-card`:
```css
.stacked-card {
  position: sticky;
  top: 0;
  height: 100vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 1.5rem 4rem;     /* 6rem top to clear sticky header */
  overflow: hidden;
  transition: transform 700ms, opacity 700ms, filter 700ms;
}

.stacked-card.stacked-pushed {
  transform: scale(0.94) translateZ(-30px);
  opacity: 0.55;
  filter: blur(2px);
}
```

Container has `perspective: 1400px` for the 3D push effect. JS scroll listener adds `.stacked-pushed` to a card when the *next* card has scrolled to within 25% of viewport top — gives the dimming illusion.

### Visual Result
As you scroll past the first step, it stays pinned to the top of the viewport. The next step's photo card scrolls up to cover it. The previous card dims, scales down, and blurs slightly — selling the depth.

---

## 15. Section Rhythm Rules

**Goal:** Never have more than 2 light sections in a row before breaking with a dark moment.

### Bg Token Map
- Dark: `bg-navy-dark` (placeholder bg behind hero photos), `bg-navy` (footer, drawer, CTAs)
- Light: `bg-cream` (default body), `bg-cream-soft` (alternate)

### Standard Page Flow
```
HERO (dark navy + photo)
  ↓
SECTION (cream)
  ↓
[≤ 2 light sections in a row]
  ↓
DARK BREAK or DARK SECTION
  ↓
[≤ 2 more light sections]
  ↓
CTA SECTION (navy)
  ↓
FOOTER (navy)
```

### `<DarkBreak>` Component
Used to inject a dark moment between two-or-more light sections. Three height presets:
- `sm`: `min-h-[45vh]` — quick visual breath
- `md`: `min-h-[60vh]` (default) — standard editorial moment
- `lg`: `min-h-[85vh]` — dramatic full-bleed

Optional content: `eyebrow`, `quote`, `attribution` — all render center-aligned with reveal animations.

```jsx
<DarkBreak
  bgImage="https://..."
  eyebrow="What Stays With Clients"
  quote="Trust is built one home at a time."
  attribution="Repeat client · Google Review"
  height="md"
/>
```

### Pages Using DarkBreak
- Homepage: 2 instances (between Intro/Pillars, between Closings/Reviews)
- About: 1 (between Practice Areas/Credentials)
- Buyers: 1 (between Process/Financing)
- Sellers: 2 (between Process/Pricing, before Valuation)
- Path-to-Ownership: 1 (before FAQ)
- Communities/[slug]: 2 (between Market/Tiers, between Life/Quote)
- Communities overview: 1 (before grid)
- Partners: 1 (before disclaimer)

---

## 16. Components

### Header (`components/Header.tsx`)
- Fixed top, full-width
- Initial state: transparent, white text/icons
- Scrolled state (scrollY > 80): cream/95 bg, dark ink text, soft hairline border
- Layout: `[Logo (portrait + name + role)] ⟷ [Search · Contact button · Hamburger]`
- Container max-width: `max-w-[1600px]`, padding `px-6 md:px-12`

### Logo (`components/Logo.tsx`)
- Circular portrait (44px desktop) + Samina Bilal wordmark + Realtor subtag
- `variant="light"` (white text on hero) or `"dark"` (ink on cream when scrolled)
- Layout: `[circular avatar] [SAMINA BILAL / REALTOR (stacked)]`

### MenuDrawer (`components/MenuDrawer.tsx`)
- Slides in from right, full-width on mobile, 520px on desktop
- Navy `#142840` background, white text
- Backdrop: `rgba(0,0,0,0.4)`
- Top: circular portrait (96px) + name + role
- Body: nav links list (Home, About, Buyers, Sellers, Path to Ownership, Communities + 6 children, Recent Closings, Trusted Partners, Reviews, Contact)
- Bottom: "DIRECT" block with phone + email
- Closes on Esc, on backdrop click, on link click
- Body scroll locked while open

### Footer (`components/Footer.tsx`)
- Background: `bg-navy`
- Padding-top: `pt-28 md:pt-36`, padding-bottom: `pb-12`
- Margin-top from page content: `mt-32`
- Two-column grid (`md:grid-cols-2 gap-20 md:gap-24`)
- **Left column:**
  - Circular portrait (112px, ring-1 white/30)
  - "SAMINA BILAL · REALTOR" caption
  - "Licensed in Virginia & Maryland" subtitle
  - DIRECT contact (phone + email)
  - Brokerage card: RE/MAX Galaxy logo placeholder + office address + brokerage phone + "Each office independently owned" disclaimer
- **Right column:**
  - "STAY IN TOUCH" eyebrow + "NEWSLETTER" heading
  - Description paragraph
  - Email input (underline-only) + Subscribe button (outline-light)
  - Social icons (Instagram, Facebook, TikTok)
- **Bottom bar:** Copyright + license #s + market data disclaimer (small caps, white/55 opacity)

### Hero (`components/Hero.tsx`)
- Full viewport height (`min-h-screen`)
- Video bg + overlay-hero
- Center content: eyebrow → display H1 (with ShimmerText) → hairline → subtitle → CTAs
- Bottom: Frosted glass stat strip with 3 Counters + chevron-down "scroll" indicator

### PageHero (`components/PageHero.tsx`)
- Light variant for pages without dark hero
- Cream bg with optional subtle photo + cream/55 overlay
- pt-48 pb-32 padding
- Eyebrow → display H1 (ShimmerText tone="light") → hairline → subtitle

### IntroSection (`components/IntroSection.tsx`)
- "Meet Samina" — homepage only
- 2-column grid: portrait left (3:4, grayscale, hairline frame) + text right (eyebrow → heading → divider → 2 paragraphs → italic quote → CTA button)
- Reveal directions: portrait from left, text staggered up

### PillarCards (`components/PillarCards.tsx`)
- 3 service cards (Buy / Sell / Path) on homepage
- Aspect `[3/4.2]` photo cards with bottom-pinned glass-dark info panel
- Reveal directions: left, up, right per card
- Cards have `glow-on-hover` so icons in glass overlay glow on card hover
- Group hover: photo scales 1.05 over 1.4s

### CommunitiesGrid (`components/CommunitiesGrid.tsx`)
- 6 community tiles in 2-column grid
- Each tile aspect `[4/3.2]`
- Photo + overlay-card + bottom glass-dark with: eyebrow (state) + city name + Median/YoY/DOM mini-stats
- Reveal directions alternate left/right per row

### PathTeaser (`components/PathTeaser.tsx`)
- Full-bleed photo + overlay-left-fade
- Glass-dark card pinned to LEFT (max-w-2xl)
- Eyebrow → heading → divider → body paragraph → btn-glass CTA
- Reveals from left

### ClosingsGallery (`components/ClosingsGallery.tsx`)
- 3-column grid of aspect `[4/3]` photo cards
- Each card: photo + overlay-card + glass-pill "SOLD" tag (top-right) + bottom glass-dark caption (neighborhood + city)
- "Load More" pagination (PAGE = 6) when not in `preview` mode
- Preview mode: shows first 6 + "See All Closings" button

### ReviewsStrip (`components/ReviewsStrip.tsx`)
- 3-column grid of glass-light blockquote cards
- Each card: 5-star rating + italic quote + hairline + figcaption (review attribution)
- Below: aggregate ratings (Counter on each: 5.0 across Zillow / Google / Realtor.com)
- Reveal directions: left, up, right

### DarkBreak (`components/DarkBreak.tsx`)
- Section interstitial — see Section 15

### ShimmerText / Reveal / Counter / StackedCards
- See respective sections (10, 12, 13, 14)

---

## 17. Pages

### Routes (Total: 14 user-facing + 4 system = 18)
| Route | Purpose | SSG |
|---|---|---|
| `/` | Homepage | static |
| `/about` | About Samina | static |
| `/buyers` | For Buyers | static |
| `/sellers` | For Sellers + valuation form | static |
| `/path-to-ownership` | Renter-to-buyer program + FAQ + sticky steps | static |
| `/communities` | 6-community overview + comparison table | static |
| `/communities/woodbridge` | Community detail | static (generateStaticParams) |
| `/communities/dumfries` | " | static |
| `/communities/ashburn` | " | static |
| `/communities/lorton` | " | static |
| `/communities/stafford` | " | static |
| `/communities/manassas` | " | static |
| `/closings` | Recent closings gallery (Load More) | static |
| `/partners` | Trusted partner network | static |
| `/reviews` | Long-form reviews + ratings | static |
| `/contact` | Contact form + details | static |
| `/sitemap.xml` | Auto-generated | static |
| `/robots.txt` | Auto-generated | static |
| `/_not-found` | Custom 404 | static |

### Homepage Structure (`app/page.tsx`)
```
<Hero />                       // dark — video + glass stat strip
<IntroSection />               // light — Meet Samina (2-col with portrait)
<DarkBreak />                  // dark — review pull-quote
<PillarCards />                // light — Buy/Sell/Path
<CommunitiesGrid />            // light-soft — 6 communities
<PathTeaser />                 // dark — Path-to-Ownership CTA
<ClosingsGallery preview />    // light — 6 recent closings
<DarkBreak />                  // dark — "why I do this work" quote
<ReviewsStrip />               // light-soft — 3 review cards + ratings
<Footer />                     // dark navy
```

### Inner Pages Pattern
Every inner page follows this skeleton:
1. **Hero** (full viewport, dark photo + overlay-hero)
   - Eyebrow → ShimmerText H1 → hairline → italic subtitle → optional CTAs
2. **Intro/Why section** (cream)
3. **Process/Cards section** (cream-soft)
4. **DarkBreak** (interstitial)
5. **Detail section** (cream)
6. **Final CTA section** (navy with photo overlay)

---

## 18. Navigation Patterns

### Nav Drawer Items (`lib/site.ts`)
```ts
export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Buyers", href: "/buyers" },
  { label: "Sellers", href: "/sellers" },
  { label: "Path to Ownership", href: "/path-to-ownership" },
  {
    label: "Communities",
    href: "/communities",
    children: [/* 6 cities */],
  },
  { label: "Recent Closings", href: "/closings" },
  { label: "Trusted Partners", href: "/partners" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact", href: "/contact" },
];
```

### Header Behavior on Scroll
- `scrollY <= 80px`: header is transparent, logo + icons + Contact button are white
- `scrollY > 80px`: header gets `bg-cream/95` + `backdrop-blur-md` + `shadow-[0_1px_0_rgba(0,0,0,0.06)]`, logo + icons turn ink-dark, Contact button gets dark border

### Smooth Scroll
Global: `html { scroll-behavior: smooth; }`. Anchor links (`#intro` from hero down-arrow) scroll smoothly to target.

---

## 19. Image Conventions

### Sources
- **Stock:** Unsplash (`images.unsplash.com`) for placeholders. Use `?w=1920&auto=format&fit=crop&q=85` query strings.
- **Cloudinary:** for hero video (`res.cloudinary.com`).
- **Local:** for Samina's portrait at `/public/images/Samina Headshot.jpeg`.

### Aspect Ratios
| Use Case | Ratio | Tailwind |
|---|---|---|
| Pillar cards (homepage Buy/Sell/Path) | 3:4.2 (vertical) | `aspect-[3/4.2]` |
| Community tiles | 4:3.2 (horizontal) | `aspect-[4/3.2]` |
| Closing tiles | 4:3 (horizontal) | `aspect-[4/3]` |
| Portrait in IntroSection / About | 3:4 (vertical) | `aspect-[3/4]` |
| Hero (full viewport) | viewport | `min-h-screen` (homepage) / `min-h-[85vh]` (inner) |
| DarkBreak | varies sm/md/lg | `min-h-[45vh]` / `[60vh]` / `[85vh]` |

### Treatment Rules
- Hero photos: full-bleed `bg-cover bg-center`, with `overlay-hero` composited on top
- Portrait images: `grayscale` filter for editorial feel (homepage Meet + About)
- Card photos: `bg-cover bg-center` + `overlay-card` + group-hover scale
- Background images on light-bg sections (IntroSection variant): `opacity-[0.12]` + `bg-cream/70` overlay (almost fully washed-out, just adds texture)

### Required Asset Files
For full deployment, replace these placeholders:
- `/public/images/Samina Headshot.jpeg` (already real)
- `/public/images/remax-galaxy-logo.png` (placeholder text shows fallback)
- `/public/closings/*.jpg` (real closing photos)

---

## 20. Content & Voice Rules

All copy lives in `lib/content.ts` — single source of truth.

### Voice
- **First person ("I help…")** — warm, conversational
- **Never self-claiming or boastful** — no "best", "elite", "luxury", "exclusive"
- **Show luxury through restraint, not by saying it**
- **Avoid:** "hustle", "grind", "hot deals", "let's get it"
- **Don't mention years licensed**
- **Never call the program "rent-to-own" or "credit repair"**
- **Service area: Virginia + Maryland only** — never mention "D.C." in the service area framing

### Sections That Get Direct, Clear Headings
- Service section: "How I Work With Clients" / "Three ways I help" — NOT "Three Ways In"
- Communities: "Where I Work Most" / "Six neighborhoods I know especially well"
- Closings: "Sold by Samina" / "Recent closings"
- Reviews: "What Clients Say" / "In their words"

### Languages Mentioned
- English, Urdu, Hindi (in About bio + Credentials)

### Tagline (consistent)
"Make Yourself at Home" — used in hero H1 and as final sign-off

---

## 21. Build / Bundler Quirks

### `backdrop-filter` + lightningcss

Next.js 16 / Turbopack uses lightningcss which over-aggressively consolidates vendor prefixes — it would strip the unprefixed `backdrop-filter` declaration in favor of the `-webkit-` version, which modern Chrome doesn't apply.

**Workaround:** all glass classes use a CSS custom property:
```css
.glass-dark {
  --frost: blur(16px) saturate(140%);
  -webkit-backdrop-filter: var(--frost);
  backdrop-filter: var(--frost);
}
```
Bundler can't safely merge `var()` references — both declarations survive.

### React 19 + CSS Shorthand/Longhand Warnings

React 19 throws hydration warnings if you set both `background` shorthand and any `backgroundClip`/`backgroundPosition` longhand. Solution: use individual longhand properties only (`backgroundColor`, `backgroundImage`, `backgroundClip`, `backgroundPosition`, `backgroundSize`, `backgroundRepeat`).

### Next.js 16 + Children.only

`React.Children.only(children)` throws on whitespace text nodes that Turbopack/React 19 leaves in JSX children arrays. Reveal's `asChild` uses `Children.toArray(children).find(isValidElement)` instead.

---

## 22. Deployment

### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Vercel
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install",
  "outputDirectory": ".next"
}
```

### Local Workflow
```bash
npm install
npm run dev    # starts on localhost:3008
npm run build  # production build
npm start      # serve production
```

---

## 23. Replication Checklist

To replicate this site exactly, an AI agent should:

### Phase 1 — Foundation
1. `npx create-next-app` with App Router + TypeScript + Tailwind
2. Set `next` to `^16.2.4`, `react` to `^19.2.5`, `tailwindcss` to `^3.4.13` (NOT v4)
3. Install `clsx`, `tailwind-merge`, `lucide-react`
4. Add `browserslist` to `package.json` per Section 1
5. Create `tailwind.config.ts` with the exact color palette and spacing tokens (Section 3, 5)
6. Load Montserrat via `next/font/google` with weights 200/300/400/500
7. Copy `app/globals.css` exactly — 510 lines including all glass utilities, overlays, buttons, animations, reveal classes, shimmer keyframes, border-shine `@property` declarations
8. Create the `cn` helper at `lib/cn.ts`

### Phase 2 — Components
Build in this order (dependencies):
1. `Logo.tsx` (uses `site.ts`)
2. `MenuDrawer.tsx`
3. `Header.tsx` (uses Logo + MenuDrawer)
4. `Footer.tsx`
5. `Reveal.tsx` + `useReveal.ts`
6. `Counter.tsx`
7. `ShimmerText.tsx`
8. `StackedCards.tsx`
9. `DarkBreak.tsx`
10. `Hero.tsx`
11. `PageHero.tsx`
12. `IntroSection.tsx`
13. `PillarCards.tsx`
14. `CommunitiesGrid.tsx`
15. `PathTeaser.tsx`
16. `ClosingsGallery.tsx`
17. `ReviewsStrip.tsx`

### Phase 3 — Content & Data
1. Copy `lib/site.ts` (brand info, nav, portrait paths)
2. Copy `lib/content.ts` (all on-page copy)
3. Copy `lib/communities.ts` (6 community details with 2026 market data)
4. Copy `lib/closings.ts` (closing items)
5. Copy `lib/reviews.ts` (testimonials)

### Phase 4 — Pages
Build each page following the inner-page pattern (Section 17):
1. `app/page.tsx` (homepage — composes all major sections + 2 DarkBreaks)
2. `app/about/page.tsx`
3. `app/buyers/page.tsx`
4. `app/sellers/page.tsx`
5. `app/path-to-ownership/page.tsx`
6. `app/communities/page.tsx` + `app/communities/[slug]/page.tsx` with `generateStaticParams`
7. `app/closings/page.tsx`
8. `app/partners/page.tsx`
9. `app/reviews/page.tsx`
10. `app/contact/page.tsx`
11. `app/not-found.tsx`
12. `app/sitemap.ts` + `app/robots.ts`

### Phase 5 — Assets
1. Drop portrait at `/public/images/Samina Headshot.jpeg`
2. Drop RE/MAX Galaxy logo at `/public/images/remax-galaxy-logo.png` (footer auto-swaps text fallback for image)
3. Drop closing photos at `/public/closings/`
4. Drop hero video at `/public/videos/` (or use Cloudinary)

### Phase 6 — Verification
1. `npm run build` should produce 18+ static routes, 0 errors
2. Every page hero shimmer should sweep on load + loop
3. Every glass card should show two opposite-direction golden border highlights
4. Hero stats should count up from 0 → target on viewport entry
5. PathTeaser glass card should pin to bottom-LEFT, not top-right (the Reveal `asChild` test)
6. Section rhythm: no more than 2 light sections in a row before a DarkBreak or dark CTA section
7. No "Washington D.C." anywhere in the site
8. Mobile: horizontal slide-ins should fall back to fade-up

---

## Appendix A: Critical Tokens At-a-Glance

```ts
// COLORS
const palette = {
  cream: "#F2EFEA",
  creamSoft: "#EDE9E2",
  navy: "#142840",
  navyDark: "#0E1C30",
  ink: "rgba(0,0,0,0.82)",
  inkMuted: "rgba(0,0,0,0.55)",
  inkSubtle: "rgba(0,0,0,0.35)",
  whitePrimary: "rgba(255,255,255,0.95)",
  goldPeak: "rgba(255,240,195,1)",
  goldSoft: "rgba(255,215,130,0.4)",
};

// FONT
const font = "Montserrat (200, 300, 400, 500 weights)";

// EASING
const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

// SPACING
const sectionY = "clamp(6rem, 12vw, 11rem)";
const sectionYLg = "clamp(8rem, 16vw, 14rem)";
const gutterX = "clamp(1.5rem, 5vw, 4rem)";

// CONTAINERS
const headerWidth = "max-w-3xl";    // ~768px text columns
const gridWidth = "max-w-[1500px]"; // editorial spread

// GLASS
const glassDarkFrost = "blur(16px) saturate(140%)";
const glassDarkBg = "rgba(0,0,0,0.28)";
const glassLightFrost = "blur(48px) saturate(190%)";
const glassLightBg = "rgba(255,255,255,0.45)";

// ANIMATION DURATIONS
const reveal = "900ms";
const shimmerSweep = "2.6s + 4s pause loop";
const borderShine = "18s linear loop";
const buttonHover = "500ms";
const cardScaleHover = "1400ms";
const iconHover = "400ms";
const counterDuration = "2.2s ease-out cubic";
```

---

**End of specification.** Together with the data files (`site.ts`, `content.ts`, `communities.ts`, `closings.ts`, `reviews.ts`) and the asset folder (`/public/`), this document is the complete frontend source-of-truth.
