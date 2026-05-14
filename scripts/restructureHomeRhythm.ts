/**
 * Restructure the homepage block sequence so no two photo-bearing
 * sections sit back-to-back. A photo-bearing section is any block
 * whose wrapper has a background image OR whose cards contain photos
 * (three_cards, community_grid, etc.). The earlier rule only counted
 * wrapper backgrounds — that was wrong.
 *
 * Current home order:
 *   10 hero (photo)
 *   20 meet_agent (text)
 *   30 dark_break #1 (photo)          ← becomes quote_pullquote (text)
 *   40 three_cards (photo cards)
 *   50 community_grid (photo cards)
 *   60 cta_band Invest (photo)         ← drop wrapper bg
 *   70 cta_band Closings (text)
 *   80 dark_break #2 (photo)
 *   90 reviews_strip (text)
 *  100 bottom_signoff (text)
 *
 * After restructure:
 *   10 hero (photo)
 *   20 meet_agent (text)
 *   30 quote_pullquote (text)          ← converted from dark_break #1
 *   40 three_cards (photo)
 *   45 quote_pullquote (text)          ← NEW bridge
 *   50 community_grid (photo)
 *   60 cta_band Invest (text)          ← bg cleared
 *   70 cta_band Closings (text)
 *   80 dark_break (photo)
 *   90 reviews_strip (text)
 *  100 bottom_signoff (text)
 *
 *   npx tsx scripts/restructureHomeRhythm.ts
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

async function main() {
  // STEP 1 — Convert dark_break #1 (position 30) into a quote_pullquote
  // Keep the quote content; drop the photo so this slot is text-only.
  const { data: db1, error: e1 } = await supabase
    .from("page_blocks")
    .select("id, data")
    .eq("page_key", "home")
    .eq("position", 30)
    .maybeSingle();
  if (e1 || !db1) throw new Error(e1?.message ?? "home pos 30 not found");

  const db1Data = db1.data as Record<string, unknown>;
  const eyebrow = (db1Data.eyebrow as string) ?? "What Clients Say Most";
  const quote = (db1Data.quote as string) ?? "";
  const attribution = (db1Data.attribution as string) ?? "";

  const { error: u1 } = await supabase
    .from("page_blocks")
    .update({
      block_type: "quote_pullquote",
      data: {
        eyebrow,
        quote,
        attribution,
        wrapper: { spacing: "large" }, // text-only, no bg
      },
    })
    .eq("id", db1.id);
  if (u1) throw new Error(u1.message);
  console.log("✓ pos 30: dark_break → quote_pullquote (text-only)");

  // STEP 2 — Insert a NEW quote_pullquote at position 45 between
  // three_cards (40) and community_grid (50)
  // First clear any leftover at 45 (idempotency)
  await supabase.from("page_blocks").delete().eq("page_key", "home").eq("position", 45);

  const { error: i1 } = await supabase.from("page_blocks").insert({
    page_key: "home",
    block_type: "quote_pullquote",
    position: 45,
    enabled: true,
    data: {
      eyebrow: "Why I'm in this work",
      quote:
        "Helping someone buy or sell their home isn't a transaction — it's a chapter in their life. I work hard to make sure it's a good one.",
      attribution: "Shoukoufa",
      wrapper: { spacing: "normal", theme: "cream" },
    },
  });
  if (i1) throw new Error(i1.message);
  console.log("✓ pos 45: NEW quote_pullquote inserted between Three Cards & Community Grid");

  // STEP 3 — Drop wrapper bg from cta_band Invest (position 60) so
  // it becomes a plain navy band instead of a 4th photo in a row.
  const { data: cta, error: e3 } = await supabase
    .from("page_blocks")
    .select("id, data")
    .eq("page_key", "home")
    .eq("position", 60)
    .maybeSingle();
  if (e3 || !cta) throw new Error(e3?.message ?? "home pos 60 not found");
  const ctaData = cta.data as Record<string, unknown>;
  const wrapper = { ...((ctaData.wrapper as Record<string, unknown>) ?? {}) };
  delete wrapper.backgroundImage;
  delete wrapper.backgroundYouTubeUrl;
  const { error: u3 } = await supabase
    .from("page_blocks")
    .update({ data: { ...ctaData, wrapper } })
    .eq("id", cta.id);
  if (u3) throw new Error(u3.message);
  console.log("✓ pos 60: cta_band Invest wrapper bg cleared (plain navy)");

  // Print final order
  const { data: all } = await supabase
    .from("page_blocks")
    .select("position, block_type, data")
    .eq("page_key", "home")
    .order("position");
  console.log("\nFinal home sequence:");
  type Row = { position: number; block_type: string; data: Record<string, unknown> };
  (all as Row[] | null)?.forEach((b) => {
    const wrapper = (b.data?.wrapper as Record<string, unknown>) ?? {};
    const hasBg = !!wrapper.backgroundImage || !!wrapper.backgroundYouTubeUrl;
    const cards = (b.data?.cards as Array<{ image?: unknown }>) ?? [];
    const hasCardImages = cards.some((c) => c.image);
    const photo = hasBg || hasCardImages || b.block_type === "community_grid";
    console.log(
      `  ${b.position.toString().padStart(3)} ${photo ? "🖼️" : "📝"}  ${b.block_type}`,
    );
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
