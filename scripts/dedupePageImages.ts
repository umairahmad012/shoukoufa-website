/**
 * Global image dedupe + editorial assignment.
 *
 * After the first normalization pass, several images repeated across
 * the site (one image used in 7 different places). This script
 * re-assigns every image-bearing slot using a GLOBAL UNIQUE POOL per
 * bucket so no image appears twice anywhere on the site.
 *
 * Slot demands per bucket (must be ≤ supply):
 *   exterior_dark  → 5 slots, 11 supply
 *   exterior_light → 8 slots, 10 supply
 *   interior_dark  → 5 slots, 14 supply
 *   interior_light → 8 slots, 10 supply
 *   urban_dark     → 5 slots,  5 supply (exactly even)
 *   urban_light    → 4 slots,  4 supply (exactly even)
 *   suburban_dark  → 1 slot,   1 supply
 *   suburban_light → 6 slots,  6 supply (exactly even)
 *
 * Communities use a fresh image per city, picked editorially:
 *   Alexandria   → suburban_light (Old Town walkability, mixed feel)
 *   Arlington    → urban_light    (Metro towers, urban)
 *   Vienna       → suburban_light (family suburb)
 *   McLean       → exterior_light (estate properties)
 *   Falls Church → suburban_light (small walkable city — picked
 *                                  separately to keep subject visible
 *                                  above the glass panel)
 *   Great Falls  → exterior_light (estate / equestrian)
 *
 *   npx tsx scripts/dedupePageImages.ts
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

type IndexEntry = { id: string; public_id: string; url: string; alt: string };
type Index = Record<Bucket, IndexEntry[]>;

const index = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "scripts/.uploaded-media-index.json"),
    "utf8",
  ),
) as Index;

// ─────────────────────────────────────────────────────────── BUCKET POOLS
//
// Each bucket exposes a `take()` that returns an unused id and a
// `takeSpecific(public_id_fragment)` that picks a particular file by
// name. Used images are tracked globally to prevent any repeat across
// the site.

function makePool(bucket: Bucket) {
  const pool = [...index[bucket]];
  const used = new Set<string>();
  return {
    take(): IndexEntry | null {
      const next = pool.find((e) => !used.has(e.id));
      if (!next) {
        console.warn(`  ⚠ bucket ${bucket} exhausted — reusing`);
        return pool[0] ?? null;
      }
      used.add(next.id);
      return next;
    },
    takeSpecific(fragment: string): IndexEntry | null {
      const match = pool.find(
        (e) => !used.has(e.id) && e.public_id.includes(fragment),
      );
      if (match) {
        used.add(match.id);
        return match;
      }
      // Fallback to next available
      return this.take();
    },
  };
}

const pools = {
  exterior_dark: makePool("exterior_dark"),
  exterior_light: makePool("exterior_light"),
  interior_dark: makePool("interior_dark"),
  interior_light: makePool("interior_light"),
  urban_dark: makePool("urban_dark"),
  urban_light: makePool("urban_light"),
  suburban_dark: makePool("suburban_dark"),
  suburban_light: makePool("suburban_light"),
};

// ─────────────────────────────────────────────────────────── PER-SLOT PLAN
//
// Order matters: I assign in this order so the most-prominent slots
// (hero of each page) get the first pick of each bucket.

type Slot = {
  kind: "wrapper" | "card" | "community";
  page: string;
  position?: number; // for wrapper / card
  slug?: string;     // for community
  cardIndex?: number; // for card
  bucket: Bucket;
  /** Optional public_id fragment to pin a specific image (e.g. for
   *  Falls Church we want a particular kind of suburban_light). */
  prefer?: string;
};

// Allocation worksheet (matches demand counts in the comment above).
const SLOTS: Slot[] = [
  // ─── exterior_dark (5 slots)
  { kind: "wrapper", page: "home", position: 10, bucket: "exterior_dark" },   // hero
  { kind: "wrapper", page: "home", position: 80, bucket: "exterior_dark" },   // dark break 2
  { kind: "wrapper", page: "buyers", position: 40, bucket: "exterior_dark" }, // dark break
  { kind: "wrapper", page: "sellers", position: 40, bucket: "exterior_dark" },// dark break
  { kind: "wrapper", page: "partners", position: 30, bucket: "exterior_dark" }, // dark break (moved from urban_dark)

  // ─── exterior_light (8 slots — home_card_2 inside three_cards)
  { kind: "wrapper", page: "home", position: 70, bucket: "exterior_light" },   // closings teaser cta
  { kind: "wrapper", page: "about", position: 60, bucket: "exterior_light" },  // cta
  { kind: "wrapper", page: "buyers", position: 10, bucket: "exterior_light" }, // hero
  { kind: "wrapper", page: "sellers", position: 10, bucket: "exterior_light" },// hero
  { kind: "wrapper", page: "closings", position: 10, bucket: "exterior_light" }, // hero
  { kind: "card", page: "home", position: 40, cardIndex: 1, bucket: "exterior_light" }, // Three Ways - Selling
  { kind: "community", page: "communities", slug: "mclean", bucket: "exterior_light" },
  { kind: "community", page: "communities", slug: "great-falls", bucket: "exterior_light" },

  // ─── interior_dark (5 slots)
  { kind: "wrapper", page: "home", position: 30, bucket: "interior_dark" },     // dark break 1
  { kind: "wrapper", page: "about", position: 40, bucket: "interior_dark" },    // dark break
  { kind: "wrapper", page: "privacy", position: 10, bucket: "interior_dark" },  // hero
  { kind: "wrapper", page: "privacy", position: 40, bucket: "interior_dark" },  // mid-page bg
  { kind: "wrapper", page: "privacy", position: 70, bucket: "interior_dark" },  // end bg

  // ─── interior_light (8 slots — home_card_1 inside three_cards)
  { kind: "wrapper", page: "home", position: 90, bucket: "interior_light" },     // reviews strip
  { kind: "wrapper", page: "about", position: 10, bucket: "interior_light" },    // hero
  { kind: "wrapper", page: "buyers", position: 70, bucket: "interior_light" },   // cta closing
  { kind: "wrapper", page: "sellers", position: 70, bucket: "interior_light" },  // cta closing
  { kind: "wrapper", page: "reviews", position: 10, bucket: "interior_light" },  // hero
  { kind: "wrapper", page: "reviews", position: 30, bucket: "interior_light" },  // cta
  { kind: "wrapper", page: "contact", position: 10, bucket: "interior_light" }, // hero
  { kind: "card", page: "home", position: 40, cardIndex: 0, bucket: "interior_light" }, // Three Ways - Buying

  // ─── urban_dark (5 slots — exactly 5 supply)
  { kind: "wrapper", page: "home", position: 60, bucket: "urban_dark" },         // cta invest teaser
  { kind: "wrapper", page: "invest", position: 10, bucket: "urban_dark" },       // hero
  { kind: "wrapper", page: "invest", position: 60, bucket: "urban_dark" },       // dark break
  { kind: "wrapper", page: "partners", position: 10, bucket: "urban_dark" },     // hero
  { kind: "card", page: "home", position: 40, cardIndex: 2, bucket: "urban_dark" }, // Three Ways - Invest

  // ─── urban_light (4 slots — exactly 4 supply)
  { kind: "wrapper", page: "invest", position: 40, bucket: "urban_light" },      // stats strip
  { kind: "wrapper", page: "invest", position: 80, bucket: "urban_light" },      // cta
  { kind: "wrapper", page: "partners", position: 40, bucket: "urban_light" },    // cta
  { kind: "community", page: "communities", slug: "arlington", bucket: "urban_light" },

  // ─── suburban_dark (1 slot)
  { kind: "wrapper", page: "communities", position: 40, bucket: "suburban_dark" }, // dark break

  // ─── suburban_light (6 slots — exactly 6 supply)
  //
  // Falls Church gets first pick — we use a specific image known to
  // have its subject in the upper half of the frame. The Gemini file
  // names are opaque, but rotating through the bucket gives Falls
  // Church a different image than the wrapper bg and the hero of
  // /communities so the same suburban_light photo doesn't show up
  // twice in the same scroll viewport.
  { kind: "community", page: "communities", slug: "falls-church", bucket: "suburban_light", prefer: "hvi" }, // pick the one used as portrait background earlier — different feel
  { kind: "community", page: "communities", slug: "vienna", bucket: "suburban_light" },
  { kind: "community", page: "communities", slug: "alexandria", bucket: "suburban_light" }, // moved from urban_light
  { kind: "wrapper", page: "communities", position: 10, bucket: "suburban_light" }, // hero
  { kind: "wrapper", page: "buyers", position: 60, bucket: "suburban_light" },      // first-time cta
  { kind: "wrapper", page: "sellers", position: 60, bucket: "suburban_light" },     // valuation form
];

// ─────────────────────────────────────────────────────────── APPLY

type BlockRow = {
  id: string;
  block_type: string;
  data: Record<string, unknown>;
};

async function applyWrapper(
  page: string,
  position: number,
  imageId: string,
): Promise<{ ok: boolean; msg: string }> {
  const { data: row, error: e1 } = await supabase
    .from("page_blocks")
    .select("id, data")
    .eq("page_key", page)
    .eq("position", position)
    .maybeSingle();
  if (e1 || !row) return { ok: false, msg: "row not found" };
  const data: Record<string, unknown> = { ...(row.data as Record<string, unknown>) };
  const wrapper = (data.wrapper as Record<string, unknown>) ?? {};
  data.wrapper = { ...wrapper, backgroundImage: { image_id: imageId } };
  const { error: e2 } = await supabase
    .from("page_blocks")
    .update({ data })
    .eq("id", row.id);
  if (e2) return { ok: false, msg: e2.message };
  return { ok: true, msg: "wrapper set" };
}

async function applyCard(
  page: string,
  position: number,
  cardIndex: number,
  imageId: string,
): Promise<{ ok: boolean; msg: string }> {
  const { data: row, error: e1 } = await supabase
    .from("page_blocks")
    .select("id, block_type, data")
    .eq("page_key", page)
    .eq("position", position)
    .maybeSingle();
  if (e1 || !row) return { ok: false, msg: "row not found" };
  const block = row as BlockRow;
  const data: Record<string, unknown> = { ...(block.data as Record<string, unknown>) };
  const cards = (data.cards as Array<Record<string, unknown>>) ?? [];
  if (cardIndex >= cards.length) {
    return { ok: false, msg: `card[${cardIndex}] not found (${cards.length} cards)` };
  }
  cards[cardIndex] = { ...cards[cardIndex], image: { image_id: imageId } };
  data.cards = cards;
  const { error: e2 } = await supabase
    .from("page_blocks")
    .update({ data })
    .eq("id", block.id);
  if (e2) return { ok: false, msg: e2.message };
  return { ok: true, msg: `card[${cardIndex}] set` };
}

async function applyCommunity(
  slug: string,
  imageId: string,
): Promise<{ ok: boolean; msg: string }> {
  const { error } = await supabase
    .from("communities")
    .update({ image_id: imageId })
    .eq("slug", slug);
  if (error) return { ok: false, msg: error.message };
  return { ok: true, msg: `community ${slug} set` };
}

async function main() {
  console.log(
    "Re-assigning every image-bearing slot with a global unique pool…\n",
  );
  let pass = 0;
  for (const slot of SLOTS) {
    const pool = pools[slot.bucket];
    const pick = slot.prefer
      ? pool.takeSpecific(slot.prefer)
      : pool.take();
    if (!pick) {
      console.log(
        `  ✗ ${slot.kind} ${slot.page}${slot.position ? ":" + slot.position : ""}${slot.slug ? ":" + slot.slug : ""}  ${slot.bucket} → no image available`,
      );
      continue;
    }
    let res: { ok: boolean; msg: string };
    if (slot.kind === "wrapper") {
      res = await applyWrapper(slot.page, slot.position!, pick.id);
    } else if (slot.kind === "card") {
      res = await applyCard(slot.page, slot.position!, slot.cardIndex!, pick.id);
    } else {
      res = await applyCommunity(slot.slug!, pick.id);
    }
    const tag = slot.kind === "community"
      ? `${slot.slug}`
      : `${slot.page}:${slot.position}${slot.cardIndex !== undefined ? `:card${slot.cardIndex}` : ""}`;
    const file = pick.public_id.split("/").pop();
    console.log(
      `  ${res.ok ? "✓" : "✗"} ${slot.bucket.padEnd(15)} → ${tag.padEnd(34)} ${file}`,
    );
    if (res.ok) pass += 1;
  }
  console.log(`\n${pass}/${SLOTS.length} slots assigned with unique images.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
