/**
 * Seed the homepage with a default block layout matching the current
 * static design. Idempotent — clears existing home blocks first.
 *
 *   npx tsx scripts/seedHomePageBlocks.ts
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

const PAGE = "home";

const h = content.home;
const a = content.about;

const blocks: Block[] = [
  // 1. Hero
  {
    page_key: PAGE,
    block_type: "hero",
    position: 10,
    enabled: true,
    data: {
      eyebrow: h.hero.eyebrow,
      titleLines: h.hero.titleLines,
      subtitle: h.hero.subtitle,
      ctas: h.hero.ctas,
      stats: h.hero.stats,
      wrapper: {},
    },
  },
  // 2. Meet Agent
  {
    page_key: PAGE,
    block_type: "meet_agent",
    position: 20,
    enabled: true,
    data: {
      eyebrow: h.meet.eyebrow,
      heading: h.meet.heading,
      body: h.meet.body,
      quote: h.meet.quote,
      cta: h.meet.cta,
      portraitSide: "left",
      wrapper: { spacing: "large", theme: "transparent" },
    },
  },
  // 3. Dark break 1
  {
    page_key: PAGE,
    block_type: "dark_break",
    position: 30,
    enabled: true,
    data: {
      eyebrow: "What Clients Say Most",
      quote:
        "She makes the process feel calm — exactly what you want when you're making the biggest decision of your life.",
      attribution: "Repeat client · Google Review",
      wrapper: {},
    },
  },
  // 4. Three Cards (Buying / Selling / Invest)
  {
    page_key: PAGE,
    block_type: "three_cards",
    position: 40,
    enabled: true,
    data: {
      eyebrow: h.services.eyebrow,
      heading: h.services.heading,
      cards: h.services.cards,
      wrapper: { spacing: "large", theme: "transparent" },
    },
  },
  // 5. Community Grid
  {
    page_key: PAGE,
    block_type: "community_grid",
    position: 50,
    enabled: true,
    data: {
      eyebrow: h.communities.eyebrow,
      heading: h.communities.heading,
      subtitle: h.communities.subtitle,
      wrapper: { theme: "cream", spacing: "large" },
    },
  },
  // 6. CTA Band — Invest teaser
  {
    page_key: PAGE,
    block_type: "cta_band",
    position: 60,
    enabled: true,
    data: {
      eyebrow: h.pathTeaser.eyebrow,
      heading: h.pathTeaser.heading,
      body: h.pathTeaser.body,
      primary: h.pathTeaser.cta,
      wrapper: {},
    },
  },
  // 7. Closings teaser (CTA band style)
  {
    page_key: PAGE,
    block_type: "cta_band",
    position: 70,
    enabled: true,
    data: {
      eyebrow: h.closingsTeaser.eyebrow,
      heading: h.closingsTeaser.heading,
      body: h.closingsTeaser.subtitle,
      primary: h.closingsTeaser.cta,
      wrapper: {},
    },
  },
  // 8. Dark break 2
  {
    page_key: PAGE,
    block_type: "dark_break",
    position: 80,
    enabled: true,
    data: {
      eyebrow: "Why I Do This Work",
      quote:
        "Real estate is the most important purchase most people make. It deserves a Real Estate Specialist who treats it that way.",
      attribution: "Shoukoufa",
      wrapper: {},
    },
  },
  // 9. Reviews strip
  {
    page_key: PAGE,
    block_type: "reviews_strip",
    position: 90,
    enabled: true,
    data: {
      eyebrow: h.reviews.eyebrow,
      heading: h.reviews.heading,
      wrapper: { theme: "cream", spacing: "large" },
    },
  },
  // 10. Bottom sign-off
  {
    page_key: PAGE,
    block_type: "bottom_signoff",
    position: 100,
    enabled: true,
    data: {
      text: h.signOff,
      wrapper: { theme: "white", spacing: "compact" },
    },
  },
];

// Silence unused-var
void a;

async function main() {
  console.log(`Clearing existing blocks for page=${PAGE}...`);
  const { error: delErr } = await supabase
    .from("page_blocks")
    .delete()
    .eq("page_key", PAGE);
  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  console.log(`Inserting ${blocks.length} blocks...`);
  const { error: insErr } = await supabase.from("page_blocks").insert(blocks);
  if (insErr) {
    console.error("Insert failed:", insErr.message);
    process.exit(1);
  }

  const { data } = await supabase
    .from("page_blocks")
    .select("position, block_type, enabled")
    .eq("page_key", PAGE)
    .order("position");
  console.log(`✓ Seeded ${data?.length} blocks:`);
  data?.forEach((b) =>
    console.log(`  ${b.position.toString().padStart(3)} · ${b.block_type}`),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
