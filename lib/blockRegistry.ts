/**
 * Block Registry — defines the library of block types the page builder
 * can place on any page. Each block type has:
 *
 *   • a unique `type` string (stored in page_blocks.block_type)
 *   • a human label + description for the admin "Add Block" picker
 *   • a `dataShape` describing the editable fields (auto-rendered as a
 *     form by the admin)
 *   • a `defaultData()` factory invoked when the admin adds a new block
 *
 * Universal wrapper fields (background image, YouTube video, theme,
 * spacing) are NOT part of dataShape — they live in `data.wrapper` and
 * are rendered/edited by the renderer + admin shell, not the block itself.
 *
 * ─── SECTION RHYTHM RULE (see WIRING.md §3.5) ───
 * Every section is one of four buckets:
 *
 *   🟦 P1 — Photo Primary background  (wrapper bg image/video)
 *           hero, dark_break, any block w/ wrapper.backgroundImage
 *   🟧 P2 — Photo Background           (cream wrapper, photo cards inside)
 *           three_cards w/ card.image, community_grid, closings_grid
 *   🟫 S  — Secondary background       (solid colored band, no photo)
 *           cta_band default (theme: navy)
 *   ⬜ T  — Plain text                  (cream/white, no photo content)
 *           everything else
 *
 *   RULE: never two sections of the SAME background bucket back-to-back.
 *         T can repeat freely — it's the bridge between bg sections.
 *         Allowed adjacencies: P1↔P2, P1↔S, P2↔S, and any ↔ T.
 *
 *   Corollary: if a block has photo cards inside (P2), its wrapper
 *   must be plain — never paint two photo layers on one section.
 */
import type { Field } from "./contentRegistry";

// ----------------------------------------------------------------------------
// UNIVERSAL WRAPPER — every block carries an optional wrapper config
// ----------------------------------------------------------------------------

export type BlockWrapper = {
  /** Cloudinary media row id, like other image pickers */
  backgroundImage?: { image_id?: string };
  /** YouTube URL or 11-char ID. Overrides backgroundImage when set. */
  backgroundYouTubeUrl?: string;
  /** Strength of the dark/light overlay over the background (0–100). */
  overlay?: "none" | "light" | "dark" | "heavy";
  /** Section vertical padding preset. */
  spacing?: "compact" | "normal" | "large";
  /** Color theme for the section. */
  theme?: "cream" | "white" | "navy" | "transparent";
  /**
   * Text color override. "auto" (default) picks dark text for cream/white
   * sections and light text for navy / photo-bg sections. "light" forces
   * white text for unreadable cases (e.g. you uploaded a dark photo bg
   * on a normally-cream section). "dark" forces ink text.
   */
  textColor?: "auto" | "light" | "dark";
};

export const wrapperShape: Record<string, Field> = {
  backgroundImage: {
    type: "image",
    label: "Background Image",
    crop: "wide",
    help: "Optional full-bleed photo behind this block. Best aspect 16:9.",
  },
  backgroundYouTubeUrl: {
    type: "text",
    label: "YouTube Video URL",
    placeholder: "https://youtube.com/watch?v=...",
    help:
      "Optional autoplaying muted-loop video background. Overrides the background image when filled in.",
  },
  overlay: {
    type: "select",
    label: "Overlay",
    help: "Dimming layer over the background. Helps text stay readable on busy photos.",
    options: [
      { value: "none", label: "None — no dim" },
      { value: "light", label: "Light — subtle white wash" },
      { value: "dark", label: "Dark — soft black wash" },
      { value: "heavy", label: "Heavy — strong dim" },
    ],
  },
  spacing: {
    type: "select",
    label: "Spacing",
    help: "Vertical padding around this section.",
    options: [
      { value: "compact", label: "Compact — tight" },
      { value: "normal", label: "Normal — default" },
      { value: "large", label: "Large — airy" },
    ],
  },
  theme: {
    type: "select",
    label: "Theme",
    help: "Base background color of this section. Ignored when a background image / video is set.",
    options: [
      { value: "transparent", label: "Transparent — inherit page bg" },
      { value: "cream", label: "Cream — warm off-white" },
      { value: "white", label: "White — pure white" },
      { value: "navy", label: "Navy — dark brand blue" },
    ],
  },
  textColor: {
    type: "select",
    label: "Text Color",
    help:
      "Use this when contrast looks wrong — e.g. you put a dark photo on a normally-cream section and the body text becomes unreadable.",
    options: [
      { value: "auto", label: "Auto — match background" },
      { value: "light", label: "Light — force white text" },
      { value: "dark", label: "Dark — force ink text" },
    ],
  },
};

// ----------------------------------------------------------------------------
// SHARED SUB-SHAPES used by multiple blocks
// ----------------------------------------------------------------------------

const ctaShape: Record<string, Field> = {
  label: { type: "text", label: "Button Label" },
  href: { type: "url", label: "Link URL", placeholder: "/contact" },
};

const statItemShape: Record<string, Field> = {
  value: { type: "text", label: "Value", help: "e.g. 5.0 or 42" },
  decimals: { type: "text", label: "Decimals", help: "e.g. 1 for 5.0" },
  prefix: { type: "text", label: "Prefix", help: "$, +, etc." },
  suffix: { type: "text", label: "Suffix", help: "★, +, %" },
  label: { type: "text", label: "Label" },
};

// ----------------------------------------------------------------------------
// BLOCK DEFINITIONS
// ----------------------------------------------------------------------------

export type BlockDef = {
  type: string;
  label: string;
  description: string;
  /** Higher-level category for the admin "Add Block" picker */
  category:
    | "Hero & Headers"
    | "Content & Cards"
    | "Numbers & Lists"
    | "Special Sections"
    | "Forms & CTAs"
    | "Visuals"
    | "Footer";
  /** Auto-rendered form fields for this block's data (excluding wrapper). */
  dataShape: Record<string, Field>;
  /** Initial data when admin adds this block. */
  defaultData: () => Record<string, unknown>;
};

export const BLOCK_DEFS: BlockDef[] = [
  // ─────────────────────────────── HERO & HEADERS
  {
    type: "hero",
    label: "Hero",
    description:
      "Full-bleed opening section with eyebrow, large title, subtitle, optional CTAs, and optional stats overlay.",
    category: "Hero & Headers",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      titleLines: {
        type: "list",
        itemType: "text",
        label: "Title Lines",
        help: "Each line stacks. Usually 1–2.",
      },
      subtitle: { type: "paragraph", label: "Subtitle", rows: 3 },
      ctas: {
        type: "array",
        label: "Buttons",
        itemShape: {
          label: { type: "text", label: "Label" },
          href: { type: "url", label: "Link" },
          style: { type: "text", label: "Style", help: '"glass" or "outline"' },
        },
        itemTitleField: "label",
        itemNoun: "Button",
      },
      stats: {
        type: "array",
        label: "Stats Overlay",
        itemShape: statItemShape,
        itemTitleField: "label",
        itemNoun: "Stat",
      },
    },
    defaultData: () => ({
      eyebrow: "",
      titleLines: ["Headline"],
      subtitle: "",
      ctas: [],
      stats: [],
    }),
  },

  // ─────────────────────────────── CONTENT & CARDS
  {
    type: "meet_agent",
    label: "Meet the Agent",
    description:
      "Portrait + bio paragraphs with optional pull-quote and CTA. The portrait pulls from Brand → Realtor Image.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "paragraph", label: "Heading", rows: 2 },
      body: { type: "list", itemType: "paragraph", label: "Body Paragraphs" },
      quote: { type: "paragraph", label: "Pull Quote", rows: 2 },
      cta: { type: "object", label: "Button", shape: ctaShape },
      portraitSide: {
        type: "text",
        label: "Portrait Side",
        help: '"left" or "right" — which side the portrait sits on.',
      },
    },
    defaultData: () => ({
      eyebrow: "Meet",
      heading: "About me.",
      body: ["Tell your story."],
      quote: "",
      cta: { label: "About", href: "/about" },
      portraitSide: "left",
    }),
  },
  {
    type: "three_cards",
    label: "Three Ways I Help",
    description:
      "Three feature cards in a row, each with title, body, photo, and CTA. Used for Buying / Selling / Invest.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      cards: {
        type: "array",
        label: "Cards",
        itemShape: {
          title: { type: "text", label: "Title" },
          body: { type: "paragraph", label: "Body", rows: 4 },
          cta: { type: "text", label: "Button Label" },
          href: { type: "url", label: "Link" },
          image: { type: "image", label: "Card Photo", crop: "portrait" },
        },
        itemTitleField: "title",
        itemNoun: "Card",
      },
    },
    defaultData: () => ({
      eyebrow: "Services",
      heading: "Three ways I help.",
      cards: [],
    }),
  },
  {
    type: "practice_areas",
    label: "Practice Areas (Numbered Cards)",
    description:
      "Three numbered cards (01/02/03) with heading + body. Used for credentials / focus areas.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      cards: {
        type: "array",
        label: "Cards",
        itemShape: {
          h: { type: "text", label: "Heading" },
          p: { type: "paragraph", label: "Body", rows: 4 },
        },
        itemTitleField: "h",
        itemNoun: "Card",
      },
    },
    defaultData: () => ({
      eyebrow: "Practice Areas",
      heading: "What I do.",
      cards: [],
    }),
  },
  {
    type: "two_column",
    label: "Two Column (Text + Image)",
    description:
      "Headline + paragraphs on one side, image on the other. Swap sides per instance.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      paragraphs: { type: "list", itemType: "paragraph", label: "Paragraphs" },
      image: { type: "image", label: "Image", crop: "landscape" },
      imageSide: {
        type: "text",
        label: "Image Side",
        help: '"left" or "right"',
      },
      cta: { type: "object", label: "Button (optional)", shape: ctaShape },
    },
    defaultData: () => ({
      eyebrow: "",
      heading: "",
      paragraphs: [""],
      imageSide: "right",
      cta: { label: "", href: "" },
    }),
  },
  {
    type: "paragraph_block",
    label: "Heading + Paragraphs",
    description: "Eyebrow, heading, then a stack of body paragraphs.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      paragraphs: { type: "list", itemType: "paragraph", label: "Paragraphs" },
    },
    defaultData: () => ({ eyebrow: "", heading: "", paragraphs: [""] }),
  },
  {
    type: "quote_pullquote",
    label: "Pull Quote",
    description: "Large italic quote with attribution.",
    category: "Content & Cards",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      quote: { type: "paragraph", label: "Quote", rows: 3 },
      attribution: { type: "text", label: "Attribution" },
    },
    defaultData: () => ({ eyebrow: "", quote: "", attribution: "" }),
  },

  // ─────────────────────────────── NUMBERS & LISTS
  {
    type: "stats_strip",
    label: "Stats Strip",
    description: "2–4 counter stats with value, label, prefix/suffix.",
    category: "Numbers & Lists",
    dataShape: {
      stats: {
        type: "array",
        label: "Stats",
        itemShape: statItemShape,
        itemTitleField: "label",
        itemNoun: "Stat",
      },
    },
    defaultData: () => ({ stats: [] }),
  },
  {
    type: "process_steps",
    label: "Process Steps (Numbered)",
    description:
      "Numbered step list with heading + body per step. Used for buyer/seller process.",
    category: "Numbers & Lists",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      steps: {
        type: "array",
        label: "Steps",
        itemShape: {
          n: { type: "text", label: "Number", help: '"01", "02"...' },
          h: { type: "text", label: "Heading" },
          p: { type: "paragraph", label: "Body", rows: 4 },
        },
        itemTitleField: "h",
        itemNoun: "Step",
      },
    },
    defaultData: () => ({
      eyebrow: "The Process",
      heading: "",
      steps: [],
    }),
  },
  {
    type: "bullet_list",
    label: "Bullet List",
    description: 'Eyebrow + heading + a list of bullet lines. Used for "Who It\'s For" type blocks.',
    category: "Numbers & Lists",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      bullets: { type: "list", itemType: "text", label: "Bullet Lines" },
    },
    defaultData: () => ({ eyebrow: "", heading: "", bullets: [""] }),
  },
  {
    type: "faq",
    label: "FAQ Accordion",
    description: "Question + answer accordion list.",
    category: "Numbers & Lists",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      items: {
        type: "array",
        label: "Questions",
        itemShape: {
          q: { type: "text", label: "Question" },
          a: { type: "paragraph", label: "Answer", rows: 4 },
        },
        itemTitleField: "q",
        itemNoun: "Question",
      },
    },
    defaultData: () => ({
      eyebrow: "Common Questions",
      heading: "Answered",
      items: [],
    }),
  },

  // ─────────────────────────────── VISUALS
  {
    type: "dark_break",
    label: "Dark Photo Strip",
    description:
      "Full-bleed dark photo break with optional eyebrow, italic quote, and attribution.",
    category: "Visuals",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      quote: { type: "paragraph", label: "Quote", rows: 2 },
      attribution: { type: "text", label: "Attribution" },
    },
    defaultData: () => ({ eyebrow: "", quote: "", attribution: "" }),
  },
  {
    type: "video_embed",
    label: "Video (Embed)",
    description: "Standalone YouTube video embedded in the section flow.",
    category: "Visuals",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      videoUrl: { type: "text", label: "YouTube URL or ID" },
      caption: { type: "paragraph", label: "Caption", rows: 2 },
    },
    defaultData: () => ({ eyebrow: "", heading: "", videoUrl: "", caption: "" }),
  },

  // ─────────────────────────────── SPECIAL SECTIONS (data-driven)
  {
    type: "community_grid",
    label: "Community Grid (6 Cards)",
    description:
      "Pulls the 6 communities and renders them as a card grid. Content managed in Admin → Communities.",
    category: "Special Sections",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      subtitle: { type: "paragraph", label: "Subtitle", rows: 3 },
    },
    defaultData: () => ({
      eyebrow: "Communities",
      heading: "Where I work most.",
      subtitle: "",
    }),
  },
  {
    type: "comparison_table",
    label: "Community Comparison Table",
    description:
      "Side-by-side market read for the six communities (median, YoY, DOM, market type).",
    category: "Special Sections",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      subtitle: { type: "paragraph", label: "Subtitle", rows: 2 },
      sourceNote: { type: "text", label: "Source Note" },
    },
    defaultData: () => ({
      eyebrow: "At a Glance",
      heading: "Side-by-Side Market Read",
      subtitle: "",
      sourceNote: "",
    }),
  },
  {
    type: "reviews_strip",
    label: "Reviews Strip",
    description:
      'Featured client reviews from the "is_featured_homepage" flag in Admin → Reviews.',
    category: "Special Sections",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
    },
    defaultData: () => ({ eyebrow: "What Clients Say", heading: "In their words." }),
  },
  {
    type: "reviews_full",
    label: "Reviews (Full List)",
    description:
      "Every visible review from Admin → Reviews. Used on the standalone /reviews page.",
    category: "Special Sections",
    dataShape: {},
    defaultData: () => ({}),
  },
  {
    type: "closings_grid",
    label: "Closings Grid",
    description:
      "Closings managed in Admin → Recent Closings. Use preview mode on the homepage to show just the first 6 with a 'See All' link; full mode (used on /closings) shows all and paginates.",
    category: "Special Sections",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      subtitle: { type: "paragraph", label: "Subtitle", rows: 2 },
      mode: {
        type: "select",
        label: "Mode",
        help:
          'Preview = first 6 only + "See All Closings" link (use on homepage). Full = all closings with Load More (use on /closings).',
        options: [
          { value: "preview", label: "Preview — first 6 + See All link" },
          { value: "full", label: "Full — all closings + Load More" },
        ],
      },
    },
    defaultData: () => ({
      eyebrow: "Recent Closings",
      heading: "",
      subtitle: "",
      mode: "full",
    }),
  },
  {
    type: "partners_directory",
    label: "Partners Directory",
    description: "Trusted partners managed in Admin → Trusted Partners.",
    category: "Special Sections",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      intro: { type: "paragraph", label: "Intro", rows: 3 },
      disclaimer: { type: "paragraph", label: "Disclaimer", rows: 3 },
    },
    defaultData: () => ({
      eyebrow: "Trusted Partners",
      heading: "",
      intro: "",
      disclaimer: "",
    }),
  },

  // ─────────────────────────────── FORMS & CTAs
  {
    type: "cta_band",
    label: "Call-to-Action Band",
    description: "Colored band with heading, body, primary + optional secondary buttons.",
    category: "Forms & CTAs",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      body: { type: "paragraph", label: "Body", rows: 3 },
      primary: { type: "object", label: "Primary Button", shape: ctaShape },
      secondary: { type: "object", label: "Secondary Button", shape: ctaShape },
    },
    defaultData: () => ({
      eyebrow: "",
      heading: "",
      body: "",
      primary: { label: "Get in Touch", href: "/contact" },
      secondary: { label: "", href: "" },
    }),
  },
  {
    type: "valuation_form",
    label: "Valuation Form",
    description: "Home valuation request form.",
    category: "Forms & CTAs",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      addressPlaceholder: { type: "text", label: "Address Placeholder" },
      notesPlaceholder: { type: "text", label: "Notes Placeholder" },
      submit: { type: "text", label: "Submit Label" },
      response: { type: "text", label: "Response Note" },
    },
    defaultData: () => ({
      eyebrow: "Request a Valuation",
      heading: "Tell me about your home.",
      addressPlaceholder: "1234 Main St, Vienna, VA 22180",
      notesPlaceholder: "Recent renovations, timing, special features...",
      submit: "Get My Valuation",
      response: "Typical response time: within 24 hours.",
    }),
  },
  {
    type: "contact_form",
    label: "Contact Form",
    description: "Name / email / phone / message form.",
    category: "Forms & CTAs",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      submit: { type: "text", label: "Submit Label" },
      consent: { type: "paragraph", label: "Consent Disclaimer", rows: 3 },
    },
    defaultData: () => ({
      eyebrow: "Send a Message",
      heading: "Tell me what you need.",
      submit: "Submit",
      consent:
        "I agree to be contacted via call, email, and text. Reply STOP to opt out at any time.",
    }),
  },
  {
    type: "direct_contact",
    label: "Direct Contact Card",
    description:
      "Displays the agent's phone, email, and licensing. Pulls from Brand Identity.",
    category: "Forms & CTAs",
    dataShape: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
    },
    defaultData: () => ({ eyebrow: "Direct Contact", heading: "" }),
  },

  // ─────────────────────────────── FOOTER
  {
    type: "bottom_signoff",
    label: "Sign-Off Line",
    description: "Final centered line at the bottom of a page.",
    category: "Footer",
    dataShape: {
      text: { type: "text", label: "Text" },
    },
    defaultData: () => ({ text: "Building legacies, one house at a time." }),
  },
];

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

export function findBlockDef(type: string): BlockDef | undefined {
  return BLOCK_DEFS.find((b) => b.type === type);
}

export function blockDefsByCategory(): Record<string, BlockDef[]> {
  const out: Record<string, BlockDef[]> = {};
  for (const b of BLOCK_DEFS) {
    (out[b.category] ||= []).push(b);
  }
  return out;
}
