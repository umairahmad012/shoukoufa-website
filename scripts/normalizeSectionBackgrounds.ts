/**
 * Normalize section backgrounds across every page so the layout follows
 * the visual rhythm rule:
 *
 *   "Sections should alternate between BG (background image / video) and
 *    plain. You can have at most 2 plain sections in a row — the 3rd in
 *    a sequence must carry a background. Also: if a block already has
 *    image-bearing containers inside (three_cards with card.image,
 *    community_grid which paints photos in its cards), the SECTION
 *    wrapper must be plain — never two photo layers."
 *
 * The script:
 *   • applies a hand-edited plan (page_key + position → "BG" | "plain")
 *   • when "BG", picks an image from the bucket assigned to that slot
 *   • when "plain", clears wrapper.backgroundImage / backgroundYouTubeUrl
 *   • also converts mis-typed `three_cards` blocks (no card images, just
 *     h/p data) to `practice_areas` block_type so they render as
 *     numbered glass-light cards instead of broken photo tiles.
 *
 *   npx tsx scripts/normalizeSectionBackgrounds.ts
 *
 * Re-runnable. Picks images round-robin from the uploaded-media index.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^"(.*)"$/, "$1");
    }
  } catch {}
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type Bucket =
  | "exterior_dark"
  | "exterior_light"
  | "interior_dark"
  | "interior_light"
  | "urban_dark"
  | "urban_light"
  | "suburban_dark"
  | "suburban_light";

type IndexEntry = { id: string; url: string };
type Index = Record<Bucket, IndexEntry[]>;

const index = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "scripts/.uploaded-media-index.json"),
    "utf8",
  ),
) as Index;

const cursor: Record<Bucket, number> = {
  exterior_dark: 0,
  exterior_light: 0,
  interior_dark: 0,
  interior_light: 0,
  urban_dark: 0,
  urban_light: 0,
  suburban_dark: 0,
  suburban_light: 0,
};
function pick(bucket: Bucket): IndexEntry | null {
  const pool = index[bucket];
  if (!pool?.length) return null;
  const it = pool[cursor[bucket] % pool.length];
  cursor[bucket] += 1;
  return it;
}

// ─────────────────────────────────────────────────────────── PER-PAGE PLAN
//
// Each entry is one block. `bg` = wrapper background image bucket (or
// `null` for plain). Editorial intent baked in:
//   • Hero blocks always have a bg.
//   • Dark-break blocks always have a bg.
//   • Three-cards + community-grid never have a wrapper bg (their cards
//     carry photos already).
//   • Between those, we alternate so no 3 plain in a row.

type Plan = Array<{
  position: number;
  bg: Bucket | null;
  /** Optional block_type fix (convert misshapen three_cards → practice_areas). */
  convertTo?: "practice_areas";
  /** For three_cards rows with image cards, per-card image buckets. */
  cardBuckets?: Bucket[];
}>;

const PAGES: Record<string, Plan> = {
  home: [
    { position: 10, bg: "exterior_dark" }, // hero
    { position: 20, bg: null }, // meet_agent (portrait inside)
    { position: 30, bg: "interior_dark" }, // dark_break
    {
      position: 40,
      bg: null,
      cardBuckets: ["interior_light", "exterior_light", "urban_dark"],
    }, // three_cards — Buying / Selling / Invest
    { position: 50, bg: null }, // community_grid (cards have photos)
    { position: 60, bg: "urban_dark" }, // cta_band Invest teaser
    { position: 70, bg: null }, // cta_band Closings teaser (text-only band)
    { position: 80, bg: "exterior_dark" }, // dark_break
    { position: 90, bg: null }, // reviews_strip (glass-light cards inside)
    { position: 100, bg: null }, // bottom_signoff
  ],

  about: [
    { position: 10, bg: "interior_light" }, // hero
    { position: 20, bg: null }, // meet_agent
    { position: 30, bg: null }, // practice_areas
    { position: 40, bg: "interior_dark" }, // dark_break
    { position: 50, bg: null }, // paragraph_block (credentials)
    { position: 60, bg: "exterior_light" }, // cta_band
  ],

  buyers: [
    { position: 10, bg: "exterior_light" }, // hero
    { position: 20, bg: null, convertTo: "practice_areas" }, // three_cards(why) → practice_areas
    { position: 30, bg: null }, // process_steps
    { position: 40, bg: "exterior_dark" }, // dark_break
    { position: 50, bg: null, convertTo: "practice_areas" }, // three_cards(loan programs)
    { position: 60, bg: "suburban_light" }, // cta_band (first-time)
    { position: 70, bg: null }, // cta_band (closing)
  ],

  sellers: [
    { position: 10, bg: "exterior_light" }, // hero
    { position: 20, bg: null, convertTo: "practice_areas" }, // three_cards(why)
    { position: 30, bg: null }, // process_steps
    { position: 40, bg: "exterior_dark" }, // dark_break
    { position: 50, bg: null }, // paragraph_block (price right)
    { position: 60, bg: "suburban_light" }, // valuation_form
    { position: 70, bg: null }, // cta_band
  ],

  invest: [
    { position: 10, bg: "urban_dark" }, // hero
    { position: 20, bg: null }, // paragraph_block (truth)
    { position: 30, bg: null }, // process_steps
    { position: 40, bg: "urban_light" }, // stats_strip — needs bg after 2 plain
    { position: 50, bg: null }, // bullet_list
    { position: 60, bg: "urban_dark" }, // dark_break
    { position: 70, bg: null }, // faq
    { position: 80, bg: "urban_light" }, // cta_band
  ],

  communities: [
    { position: 10, bg: "suburban_light" }, // hero
    { position: 20, bg: null }, // comparison_table
    { position: 30, bg: null }, // community_grid (cards have photos)
    { position: 40, bg: "suburban_dark" }, // dark_break
  ],

  closings: [
    { position: 10, bg: "exterior_light" }, // hero
    { position: 20, bg: null }, // closings_grid (cards have photos)
  ],

  reviews: [
    { position: 10, bg: "interior_light" }, // hero
    { position: 20, bg: null }, // reviews_full (glass cards)
    { position: 30, bg: "interior_light" }, // cta_band
  ],

  partners: [
    { position: 10, bg: "urban_dark" }, // hero
    { position: 20, bg: null }, // partners_directory
    { position: 30, bg: "urban_dark" }, // dark_break
    { position: 40, bg: null }, // cta_band
  ],

  contact: [
    { position: 10, bg: "interior_light" }, // hero
    { position: 20, bg: null }, // contact_form
    { position: 30, bg: null }, // direct_contact
  ],

  privacy: [
    { position: 10, bg: "interior_dark" }, // hero
    { position: 20, bg: null }, // paragraph_block
    { position: 30, bg: null }, // paragraph_block
    { position: 40, bg: "interior_dark" }, // paragraph_block (bg here to break)
    { position: 50, bg: null }, // bullet_list
    { position: 60, bg: null }, // paragraph_block
    { position: 70, bg: "interior_dark" }, // paragraph_block
  ],
};

type BlockRow = {
  id: string;
  block_type: string;
  data: Record<string, unknown>;
};

async function patch(
  pageKey: string,
  entry: Plan[number],
): Promise<{ ok: boolean; msg: string }> {
  const { data: row, error: e1 } = await supabase
    .from("page_blocks")
    .select("id, block_type, data")
    .eq("page_key", pageKey)
    .eq("position", entry.position)
    .maybeSingle();
  if (e1 || !row) return { ok: false, msg: "row not found" };

  const block = row as BlockRow;
  const data: Record<string, unknown> = { ...block.data };

  // Wrapper background — set or clear
  const wrapper =
    (data.wrapper as Record<string, unknown> | undefined) ?? {};
  if (entry.bg) {
    const p = pick(entry.bg);
    if (p) {
      data.wrapper = {
        ...wrapper,
        backgroundImage: { image_id: p.id },
        backgroundYouTubeUrl: "",
      };
    }
  } else {
    // Plain — strip both image and YouTube
    const w = { ...wrapper };
    delete w.backgroundImage;
    delete w.backgroundYouTubeUrl;
    data.wrapper = w;
  }

  // Per-card images for three_cards
  if (
    block.block_type === "three_cards" &&
    entry.cardBuckets &&
    !entry.convertTo
  ) {
    const cards = (data.cards as Array<Record<string, unknown>>) ?? [];
    data.cards = cards.map((card, i) => {
      const cb = entry.cardBuckets![i];
      if (!cb) return card;
      const cardImg = pick(cb);
      if (!cardImg) return card;
      return { ...card, image: { image_id: cardImg.id } };
    });
  }

  // Block-type conversion (three_cards → practice_areas)
  let newType: string | undefined;
  if (entry.convertTo === "practice_areas" && block.block_type === "three_cards") {
    const cards = (data.cards as Array<Record<string, unknown>>) ?? [];
    // Move card.h/p OR card.title/body into the practice_areas shape (h/p)
    const converted = cards.map((c) => ({
      h: (c.h as string) ?? (c.title as string) ?? "",
      p: (c.p as string) ?? (c.body as string) ?? "",
    }));
    data.cards = converted;
    newType = "practice_areas";
  }

  const update: Record<string, unknown> = { data };
  if (newType) update.block_type = newType;

  const { error: e2 } = await supabase
    .from("page_blocks")
    .update(update)
    .eq("id", block.id);
  if (e2) return { ok: false, msg: e2.message };

  const note =
    (entry.bg ? `BG=${entry.bg}` : "plain") +
    (newType ? ` · → ${newType}` : "") +
    (entry.cardBuckets ? ` · cards=[${entry.cardBuckets.join(", ")}]` : "");
  return { ok: true, msg: note };
}

async function main() {
  console.log("Normalizing section backgrounds across every page…\n");
  let pass = 0;
  let total = 0;
  for (const [pageKey, plan] of Object.entries(PAGES)) {
    console.log(`/${pageKey === "home" ? "" : pageKey}`);
    for (const entry of plan) {
      total += 1;
      const res = await patch(pageKey, entry);
      console.log(`  ${res.ok ? "✓" : "✗"} pos ${entry.position}  ${res.msg}`);
      if (res.ok) pass += 1;
    }
  }
  console.log(`\n${pass}/${total} block rows normalized.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
