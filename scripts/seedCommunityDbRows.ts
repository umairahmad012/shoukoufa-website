/**
 * Mirror `lib/communities.ts` into the `communities` table and assign
 * an `image_id` from the uploaded media library so each community card
 * becomes admin-editable (Admin → Communities → [slug] picks a fresh
 * image from the Media Library).
 *
 *   npx tsx scripts/seedCommunityDbRows.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { communities } from "../lib/communities";

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

const index = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "scripts/.uploaded-media-index.json"),
    "utf8",
  ),
) as Record<string, Array<{ id: string }>>;

// Per-community editorial pick — match the urban/suburban feel of each city.
// Arlington = urban_light (urban Metro vibe)
// Vienna = suburban_light (family neighborhoods)
// McLean = exterior_light (estates)
// Falls Church = suburban_light (walkable city-within-county)
// Great Falls = exterior_light (estate properties)
// Alexandria = urban_light (Old Town walkability)
const ASSIGNMENTS: Record<string, { bucket: string; cursor: number }> = {
  alexandria: { bucket: "urban_light", cursor: 0 },
  arlington: { bucket: "urban_light", cursor: 1 },
  vienna: { bucket: "suburban_light", cursor: 0 },
  mclean: { bucket: "exterior_light", cursor: 0 },
  "falls-church": { bucket: "suburban_light", cursor: 2 },
  "great-falls": { bucket: "exterior_light", cursor: 1 },
};

async function main() {
  let i = 10;
  for (const c of communities) {
    const a = ASSIGNMENTS[c.slug];
    const pool = a ? index[a.bucket] : null;
    const imageId = pool && pool.length > 0 ? pool[a!.cursor % pool.length].id : null;

    const row = {
      slug: c.slug,
      name: c.name,
      state: c.state,
      tagline: c.tagline,
      about: c.about,
      market_year_summary: c.market2026,
      agent_quote: c.agentQuote,
      median_price: c.median,
      yoy_change: c.yoy,
      yoy_direction: c.yoyDirection,
      days_on_market: c.dom,
      market_type: c.marketType,
      data_year: 2026,
      image_id: imageId,
      display_order: i,
      is_visible: true,
      price_tiers: c.priceTiers,
      life: c.life,
    };

    const { error } = await supabase
      .from("communities")
      .upsert(row, { onConflict: "slug" });
    if (error) {
      console.log(`✗ ${c.slug}: ${error.message}`);
    } else {
      console.log(`✓ ${c.slug}  →  image_id=${imageId ?? "(none)"}`);
    }
    i += 10;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
