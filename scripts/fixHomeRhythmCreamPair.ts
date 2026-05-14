/**
 * Home page positions 45 (quote_pullquote "Why I'm in this work") and
 * 50 (community_grid) are both cream-themed. The bucket rhythm rule
 * (P2 vs T) is technically satisfied, but the two cream sections flow
 * into each other visually with no separator, which the frontend audit
 * flagged. Flip pos 45 to white so the quote sits as a clear break
 * between the three_cards (transparent) above and the community_grid
 * (cream) below.
 *
 *   npx tsx scripts/fixHomeRhythmCreamPair.ts
 *
 * Idempotent.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const t = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of t.split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {}
}
loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  const { data: row } = await sb
    .from("page_blocks")
    .select("id,block_type,data")
    .eq("page_key", "home")
    .eq("position", 45)
    .single();
  if (!row) throw new Error("home pos 45 not found");
  if (row.block_type !== "quote_pullquote") {
    throw new Error(`home pos 45 is ${row.block_type}, not quote_pullquote — bail`);
  }
  const data = row.data as Record<string, unknown>;
  const wrapper = (data.wrapper ?? {}) as Record<string, unknown>;
  if (wrapper.theme === "white") {
    console.log("home pos 45 already theme=white — nothing to do");
    return;
  }
  wrapper.theme = "white";
  data.wrapper = wrapper;
  const { error } = await sb.from("page_blocks").update({ data }).eq("id", row.id);
  if (error) throw error;
  console.log("home pos 45 (quote_pullquote) → theme=white (was cream)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
