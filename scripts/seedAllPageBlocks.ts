/**
 * Seed page_blocks for every page on the site. Idempotent — clears any
 * existing rows per page before inserting. Use this whenever you want to
 * reset a page back to its "designed" default layout.
 *
 *   npx tsx scripts/seedAllPageBlocks.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { content } from "../lib/content";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^"(.*)"$/, "$1");
    }
  } catch {
    /* ignore */
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

type Block = {
  page_key: string;
  block_type: string;
  position: number;
  enabled: boolean;
  data: Record<string, unknown>;
};

const h = content.home;
const a = content.about;
const b = content.buyers;
const s = content.sellers;
const p = content.path;
const partnersC = content.partners;
const comm = content.communities;
const closings = content.closings;
const reviewsC = content.reviews;
const contactC = content.contact;

const ALL: Block[] = [
  // ───────────────────────────────────────────────────────────── HOME
  { page_key: "home", block_type: "hero", position: 10, enabled: true, data: { eyebrow: h.hero.eyebrow, titleLines: h.hero.titleLines, subtitle: h.hero.subtitle, ctas: h.hero.ctas, stats: h.hero.stats, wrapper: {} } },
  { page_key: "home", block_type: "meet_agent", position: 20, enabled: true, data: { eyebrow: h.meet.eyebrow, heading: h.meet.heading, body: h.meet.body, quote: h.meet.quote, cta: h.meet.cta, portraitSide: "left", wrapper: { spacing: "large" } } },
  { page_key: "home", block_type: "dark_break", position: 30, enabled: true, data: { eyebrow: "What Clients Say Most", quote: "She makes the process feel calm — exactly what you want when you're making the biggest decision of your life.", attribution: "Repeat client · Google Review", wrapper: {} } },
  { page_key: "home", block_type: "three_cards", position: 40, enabled: true, data: { eyebrow: h.services.eyebrow, heading: h.services.heading, cards: h.services.cards, wrapper: { spacing: "large" } } },
  { page_key: "home", block_type: "community_grid", position: 50, enabled: true, data: { eyebrow: h.communities.eyebrow, heading: h.communities.heading, subtitle: h.communities.subtitle, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "home", block_type: "cta_band", position: 60, enabled: true, data: { eyebrow: h.pathTeaser.eyebrow, heading: h.pathTeaser.heading, body: h.pathTeaser.body, primary: h.pathTeaser.cta, wrapper: {} } },
  { page_key: "home", block_type: "cta_band", position: 70, enabled: true, data: { eyebrow: h.closingsTeaser.eyebrow, heading: h.closingsTeaser.heading, body: h.closingsTeaser.subtitle, primary: h.closingsTeaser.cta, wrapper: {} } },
  { page_key: "home", block_type: "dark_break", position: 80, enabled: true, data: { eyebrow: "Why I Do This Work", quote: "Real estate is the most important purchase most people make. It deserves a Real Estate Specialist who treats it that way.", attribution: "Shoukoufa", wrapper: {} } },
  { page_key: "home", block_type: "reviews_strip", position: 90, enabled: true, data: { eyebrow: h.reviews.eyebrow, heading: h.reviews.heading, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "home", block_type: "bottom_signoff", position: 100, enabled: true, data: { text: h.signOff, wrapper: { theme: "white", spacing: "compact" } } },

  // ───────────────────────────────────────────────────────────── ABOUT
  { page_key: "about", block_type: "hero", position: 10, enabled: true, data: { eyebrow: a.hero.eyebrow, titleLines: a.hero.titleLines, subtitle: a.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "about", block_type: "meet_agent", position: 20, enabled: true, data: { eyebrow: a.bio.eyebrow, heading: "", body: a.bio.paragraphs, quote: "", cta: { label: "", href: "" }, portraitSide: "left", wrapper: { spacing: "large" } } },
  { page_key: "about", block_type: "practice_areas", position: 30, enabled: true, data: { eyebrow: a.practiceAreas.eyebrow, heading: a.practiceAreas.heading, cards: a.practiceAreas.cards, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "about", block_type: "dark_break", position: 40, enabled: true, data: { eyebrow: "What Stays With Clients", quote: "Trust is built one home at a time.", attribution: "", wrapper: {} } },
  { page_key: "about", block_type: "paragraph_block", position: 50, enabled: true, data: { eyebrow: a.credentials.eyebrow, heading: a.credentials.heading, paragraphs: a.credentials.items.map((it) => `${it.label}: ${it.value}`), wrapper: {} } },
  { page_key: "about", block_type: "cta_band", position: 60, enabled: true, data: { eyebrow: "", heading: a.cta.heading, body: a.cta.body, primary: a.cta.primary, secondary: a.cta.secondary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── BUYERS
  { page_key: "buyers", block_type: "hero", position: 10, enabled: true, data: { eyebrow: b.hero.eyebrow, titleLines: b.hero.titleLines, subtitle: b.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "buyers", block_type: "three_cards", position: 20, enabled: true, data: { eyebrow: b.why.eyebrow, heading: b.why.heading, cards: b.why.cards.map((c) => ({ title: c.h, body: c.p, cta: "", href: "" })), wrapper: { spacing: "large" } } },
  { page_key: "buyers", block_type: "process_steps", position: 30, enabled: true, data: { eyebrow: b.process.eyebrow, heading: b.process.heading, steps: b.process.steps, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "buyers", block_type: "dark_break", position: 40, enabled: true, data: { eyebrow: "Between Steps", quote: "A house isn't a home until it fits your life.", attribution: "", wrapper: {} } },
  { page_key: "buyers", block_type: "three_cards", position: 50, enabled: true, data: { eyebrow: b.financing.eyebrow, heading: b.financing.heading, cards: b.financing.cards.map((c) => ({ title: c.h, body: c.p, cta: "", href: "" })), wrapper: { spacing: "large" } } },
  { page_key: "buyers", block_type: "cta_band", position: 60, enabled: true, data: { eyebrow: b.firstTimeCallout.eyebrow, heading: b.firstTimeCallout.heading, body: b.firstTimeCallout.body, primary: b.firstTimeCallout.cta, wrapper: {} } },
  { page_key: "buyers", block_type: "cta_band", position: 70, enabled: true, data: { eyebrow: "", heading: b.cta.heading, body: b.cta.body, primary: b.cta.primary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── SELLERS
  { page_key: "sellers", block_type: "hero", position: 10, enabled: true, data: { eyebrow: s.hero.eyebrow, titleLines: s.hero.titleLines, subtitle: s.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "sellers", block_type: "three_cards", position: 20, enabled: true, data: { eyebrow: s.why.eyebrow, heading: s.why.heading, cards: s.why.cards.map((c) => ({ title: c.h, body: c.p, cta: "", href: "" })), wrapper: { spacing: "large" } } },
  { page_key: "sellers", block_type: "process_steps", position: 30, enabled: true, data: { eyebrow: s.process.eyebrow, heading: s.process.heading, steps: s.process.steps, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "sellers", block_type: "dark_break", position: 40, enabled: true, data: { eyebrow: "Pricing & Marketing", quote: "The first fourteen days are everything.", attribution: "", wrapper: {} } },
  { page_key: "sellers", block_type: "paragraph_block", position: 50, enabled: true, data: { eyebrow: s.pricing.eyebrow, heading: s.pricing.heading, paragraphs: s.pricing.paragraphs, wrapper: {} } },
  { page_key: "sellers", block_type: "valuation_form", position: 60, enabled: true, data: { eyebrow: s.valuation.eyebrow, heading: s.valuation.heading, addressPlaceholder: s.valuation.placeholders.address, notesPlaceholder: s.valuation.placeholders.notes, submit: s.valuation.submit, response: s.valuation.response, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "sellers", block_type: "cta_band", position: 70, enabled: true, data: { eyebrow: "", heading: s.cta.heading, body: s.cta.body, primary: s.cta.primary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── INVEST
  { page_key: "invest", block_type: "hero", position: 10, enabled: true, data: { eyebrow: p.hero.eyebrow, titleLines: p.hero.titleLines, subtitle: p.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "invest", block_type: "paragraph_block", position: 20, enabled: true, data: { eyebrow: p.truth.eyebrow, heading: p.truth.heading, paragraphs: [p.truth.body], wrapper: { spacing: "large" } } },
  { page_key: "invest", block_type: "process_steps", position: 30, enabled: true, data: { eyebrow: "The Process", heading: "Four Steps to a Smart Acquisition", steps: p.steps.map((st) => ({ n: st.n, h: st.title, p: st.body })), wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "invest", block_type: "stats_strip", position: 40, enabled: true, data: { stats: p.stats.map((s) => ({ value: String(s.to), prefix: s.prefix, suffix: s.suffix, label: s.label })), wrapper: { spacing: "large" } } },
  { page_key: "invest", block_type: "bullet_list", position: 50, enabled: true, data: { eyebrow: p.forWho.eyebrow, heading: p.forWho.heading, bullets: p.forWho.lines, wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "invest", block_type: "dark_break", position: 60, enabled: true, data: { eyebrow: "The Strategy", quote: "Real properties. Real numbers. Real returns.", attribution: "", wrapper: {} } },
  { page_key: "invest", block_type: "faq", position: 70, enabled: true, data: { eyebrow: "Common Questions", heading: "Answered", items: p.faqs, wrapper: { spacing: "large" } } },
  { page_key: "invest", block_type: "cta_band", position: 80, enabled: true, data: { eyebrow: "", heading: p.cta.heading, body: p.cta.body, primary: p.cta.primary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── COMMUNITIES (INDEX)
  { page_key: "communities", block_type: "hero", position: 10, enabled: true, data: { eyebrow: comm.hero.eyebrow, titleLines: comm.hero.titleLines, subtitle: comm.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "communities", block_type: "comparison_table", position: 20, enabled: true, data: { eyebrow: comm.tableIntro.eyebrow, heading: comm.tableIntro.heading, subtitle: comm.tableIntro.subtitle, sourceNote: comm.tableIntro.sourceNote, wrapper: { spacing: "large" } } },
  { page_key: "communities", block_type: "community_grid", position: 30, enabled: true, data: { eyebrow: "", heading: "Six neighborhoods, six personalities.", subtitle: "", wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "communities", block_type: "dark_break", position: 40, enabled: true, data: { eyebrow: "Six Neighborhoods, One Specialist", quote: "Local matters.", attribution: "", wrapper: {} } },

  // ───────────────────────────────────────────────────────────── CLOSINGS
  { page_key: "closings", block_type: "hero", position: 10, enabled: true, data: { eyebrow: closings.hero.eyebrow, titleLines: closings.hero.titleLines, subtitle: closings.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "closings", block_type: "closings_grid", position: 20, enabled: true, data: { eyebrow: "", heading: "", subtitle: "", cta: { label: "", href: "" }, wrapper: { spacing: "large" } } },

  // ───────────────────────────────────────────────────────────── REVIEWS
  { page_key: "reviews", block_type: "hero", position: 10, enabled: true, data: { eyebrow: reviewsC.hero.eyebrow, titleLines: reviewsC.hero.titleLines, subtitle: reviewsC.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "reviews", block_type: "reviews_full", position: 20, enabled: true, data: { wrapper: { theme: "cream", spacing: "large" } } },
  { page_key: "reviews", block_type: "cta_band", position: 30, enabled: true, data: { eyebrow: "", heading: reviewsC.cta.heading, body: reviewsC.cta.body, primary: reviewsC.cta.primary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── PARTNERS
  { page_key: "partners", block_type: "hero", position: 10, enabled: true, data: { eyebrow: partnersC.hero.eyebrow, titleLines: partnersC.hero.titleLines, subtitle: partnersC.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "partners", block_type: "partners_directory", position: 20, enabled: true, data: { eyebrow: "My Network", heading: "Trusted partners.", intro: partnersC.intro.body, disclaimer: partnersC.disclaimer, wrapper: { spacing: "large" } } },
  { page_key: "partners", block_type: "dark_break", position: 30, enabled: true, data: { eyebrow: "", quote: "", attribution: "", wrapper: {} } },
  { page_key: "partners", block_type: "cta_band", position: 40, enabled: true, data: { eyebrow: "", heading: partnersC.cta.heading, body: partnersC.cta.body, primary: partnersC.cta.primary, wrapper: {} } },

  // ───────────────────────────────────────────────────────────── CONTACT
  { page_key: "contact", block_type: "hero", position: 10, enabled: true, data: { eyebrow: contactC.hero.eyebrow, titleLines: contactC.hero.titleLines, subtitle: contactC.hero.subtitle, ctas: [], stats: [], wrapper: {} } },
  { page_key: "contact", block_type: "contact_form", position: 20, enabled: true, data: { eyebrow: contactC.formIntro.eyebrow, heading: contactC.formIntro.heading, submit: contactC.submit, consent: contactC.consent, wrapper: { spacing: "large" } } },
  { page_key: "contact", block_type: "direct_contact", position: 30, enabled: true, data: { eyebrow: contactC.detailsIntro.eyebrow, heading: contactC.detailsIntro.heading, wrapper: { theme: "cream", spacing: "large" } } },
];

async function main() {
  const pages = Array.from(new Set(ALL.map((b) => b.page_key)));
  console.log(`Clearing existing blocks for ${pages.length} pages...`);
  for (const pk of pages) {
    const { error } = await supabase
      .from("page_blocks")
      .delete()
      .eq("page_key", pk);
    if (error) {
      console.error(`Delete failed for ${pk}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`Inserting ${ALL.length} blocks...`);
  const { error } = await supabase.from("page_blocks").insert(ALL);
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  // Summary
  for (const pk of pages) {
    const { data } = await supabase
      .from("page_blocks")
      .select("position, block_type")
      .eq("page_key", pk)
      .order("position");
    console.log(`✓ ${pk}: ${data?.length} blocks`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
