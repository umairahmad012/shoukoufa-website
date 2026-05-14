/**
 * Replace stock Unsplash images on every block of every page with the
 * uploaded Cloudinary images from `scripts/.uploaded-media-index.json`.
 *
 * Strategy:
 *   • Each `(page_key, position)` is assigned a category + theme based
 *     on the editorial intent for that slot (drama vs. warmth vs.
 *     investment-vibe, etc.).
 *   • Within each category bucket we round-robin through the available
 *     image IDs so we don't reuse the same image twice.
 *   • For `three_cards` blocks we also assign one image per card.
 *   • The block's existing `data` is preserved — we only patch the
 *     wrapper.backgroundImage.image_id (and image.image_id for card
 *     images). Admin can still crop / swap / replace from
 *     `/admin/builder/<page>` since everything goes through media_ids.
 *
 *   npx tsx scripts/swapPageBlockImages.ts
 *
 * Re-running is safe — it overwrites the previous assignment with a
 * fresh round-robin pick using the same plan.
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
  } catch {
    /* ignore */
  }
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

type IndexEntry = { id: string; public_id: string; url: string; alt: string };
type Index = Record<Bucket, IndexEntry[]>;

const index = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "scripts/.uploaded-media-index.json"),
    "utf8",
  ),
) as Index;

// ---------- round-robin picker --------------------------------------------
// Tracks per-bucket cursor so we cycle through images instead of always
// taking the first one.
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
  if (!pool || pool.length === 0) return null;
  const item = pool[cursor[bucket] % pool.length];
  cursor[bucket] += 1;
  return item;
}

// ---------- editorial plan -------------------------------------------------
// One entry per block that gets a background. Positions match what the
// seed scripts assigned.

type Plan = {
  page: string;
  position: number;
  bucket: Bucket;
  /** For three_cards: per-card image buckets (left-to-right). */
  cardBuckets?: Bucket[];
};

const PLAN: Plan[] = [
  // ════════════════════════════════════════════════════════════════ HOME
  // 10 hero — dramatic exterior at dusk
  { page: "home", position: 10, bucket: "exterior_dark" },
  // 30 dark break #1 — warm interior
  { page: "home", position: 30, bucket: "interior_dark" },
  // 40 three_cards — Buying / Selling / Invest each get their own
  {
    page: "home",
    position: 40,
    bucket: "interior_light", // wrapper bg (kept transparent typically)
    cardBuckets: ["interior_light", "exterior_light", "urban_dark"],
  },
  // 60 cta_band — Invest teaser → urban dark
  { page: "home", position: 60, bucket: "urban_dark" },
  // 70 cta_band — Closings teaser → exterior light (sold homes)
  { page: "home", position: 70, bucket: "exterior_light" },
  // 80 dark break #2 — exterior dark
  { page: "home", position: 80, bucket: "exterior_dark" },
  // 90 reviews_strip — soft interior light
  { page: "home", position: 90, bucket: "interior_light" },

  // ════════════════════════════════════════════════════════════════ ABOUT
  // 10 hero — uses portrait, but bg also accepts an image; give a soft cream
  { page: "about", position: 10, bucket: "interior_light" },
  // 40 dark break — moody interior
  { page: "about", position: 40, bucket: "interior_dark" },
  // 60 cta — exterior light
  { page: "about", position: 60, bucket: "exterior_light" },

  // ════════════════════════════════════════════════════════════════ BUYERS
  // 10 hero — bright suburban exterior (welcoming first-home vibe)
  { page: "buyers", position: 10, bucket: "exterior_light" },
  // 40 dark break — moody exterior
  { page: "buyers", position: 40, bucket: "exterior_dark" },
  // 60 cta (first-time callout) — suburban light
  { page: "buyers", position: 60, bucket: "suburban_light" },
  // 70 cta (closing) — interior light (cozy)
  { page: "buyers", position: 70, bucket: "interior_light" },

  // ════════════════════════════════════════════════════════════════ SELLERS
  // 10 hero — exterior light (sold home)
  { page: "sellers", position: 10, bucket: "exterior_light" },
  // 40 dark break — moody exterior
  { page: "sellers", position: 40, bucket: "exterior_dark" },
  // 60 valuation_form — bright suburban
  { page: "sellers", position: 60, bucket: "suburban_light" },
  // 70 cta — interior light
  { page: "sellers", position: 70, bucket: "interior_light" },

  // ════════════════════════════════════════════════════════════════ INVEST
  // 10 hero — urban dark (investment, NYC-ish skyline)
  { page: "invest", position: 10, bucket: "urban_dark" },
  // 60 dark break — urban dark continuation
  { page: "invest", position: 60, bucket: "urban_dark" },
  // 80 cta — urban light (daytime city)
  { page: "invest", position: 80, bucket: "urban_light" },

  // ════════════════════════════════════════════════════════════════ COMMUNITIES
  // 10 hero — suburban light (Northern Virginia neighborhoods)
  { page: "communities", position: 10, bucket: "suburban_light" },
  // 40 dark break — only 1 suburban dark, use it here for variety
  { page: "communities", position: 40, bucket: "suburban_dark" },

  // ════════════════════════════════════════════════════════════════ CLOSINGS
  // 10 hero — exterior light suburban
  { page: "closings", position: 10, bucket: "exterior_light" },

  // ════════════════════════════════════════════════════════════════ REVIEWS
  // 10 hero — interior light (welcoming)
  { page: "reviews", position: 10, bucket: "interior_light" },
  // 30 cta — interior light continuation
  { page: "reviews", position: 30, bucket: "interior_light" },

  // ════════════════════════════════════════════════════════════════ PARTNERS
  // 10 hero — urban dark (network / city)
  { page: "partners", position: 10, bucket: "urban_dark" },
  // 30 dark break — urban dark
  { page: "partners", position: 30, bucket: "urban_dark" },
  // 40 cta — urban light
  { page: "partners", position: 40, bucket: "urban_light" },

  // ════════════════════════════════════════════════════════════════ CONTACT
  // 10 hero — interior light (welcoming)
  { page: "contact", position: 10, bucket: "interior_light" },

  // ════════════════════════════════════════════════════════════════ PRIVACY
  // 10 hero — interior dark (formal / legal feel)
  { page: "privacy", position: 10, bucket: "interior_dark" },
];

// ---------- updater --------------------------------------------------------

type BlockRow = {
  id: string;
  block_type: string;
  data: Record<string, unknown> & {
    wrapper?: { backgroundImage?: { image_id?: string } };
  };
};

async function patchBlock(
  pageKey: string,
  position: number,
  bucket: Bucket,
  cardBuckets?: Bucket[],
): Promise<{ ok: boolean; msg: string; changedCards?: number }> {
  const { data: row, error: e1 } = await supabase
    .from("page_blocks")
    .select("id, block_type, data")
    .eq("page_key", pageKey)
    .eq("position", position)
    .maybeSingle();
  if (e1 || !row) return { ok: false, msg: `row not found` };

  const block = row as BlockRow;
  const newData: Record<string, unknown> = { ...block.data };

  // Set the wrapper.backgroundImage.image_id
  const picked = pick(bucket);
  if (picked) {
    const wrapper = (newData.wrapper as Record<string, unknown> | undefined) ?? {};
    newData.wrapper = {
      ...wrapper,
      backgroundImage: { image_id: picked.id },
    };
  }

  // For three_cards, also assign per-card images
  let changedCards = 0;
  if (block.block_type === "three_cards" && cardBuckets && cardBuckets.length) {
    const cards = (newData.cards as Array<Record<string, unknown>>) ?? [];
    const next = cards.map((card, i) => {
      const cb = cardBuckets[i];
      if (!cb) return card;
      const cardPicked = pick(cb);
      if (!cardPicked) return card;
      changedCards += 1;
      return {
        ...card,
        image: { image_id: cardPicked.id },
      };
    });
    newData.cards = next;
  }

  const { error: e2 } = await supabase
    .from("page_blocks")
    .update({ data: newData })
    .eq("id", block.id);
  if (e2) return { ok: false, msg: e2.message };

  return {
    ok: true,
    msg: `${bucket}${changedCards ? ` + ${changedCards} cards` : ""}`,
    changedCards,
  };
}

async function main() {
  console.log("Swapping stock images for uploaded ones across all blocks…\n");
  const checklist: Array<{ page: string; position: number; status: string; note: string }> = [];

  for (const item of PLAN) {
    const res = await patchBlock(item.page, item.position, item.bucket, item.cardBuckets);
    checklist.push({
      page: item.page,
      position: item.position,
      status: res.ok ? "✓" : "✗",
      note: res.msg,
    });
    console.log(
      `  ${res.ok ? "✓" : "✗"} /${item.page === "home" ? "" : item.page}  pos ${item.position}  →  ${res.msg}`,
    );
  }

  console.log(`\n${checklist.filter((c) => c.status === "✓").length}/${checklist.length} blocks updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
