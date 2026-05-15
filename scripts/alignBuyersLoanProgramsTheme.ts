/**
 * Align the buyers-page "Loan programs worth knowing." block (pos 50)
 * to the same visual style as "What you actually get with me." (pos 20).
 *
 * The two are the same block type (practice_areas) — the only reason
 * they look different is wrapper.theme. Pos 50 had theme="white" which
 * flattened the cream/golden editorial look. Strip the override.
 *
 * Idempotent.
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
  const { data: row, error } = await sb
    .from("page_blocks")
    .select("id, data")
    .eq("page_key", "buyers")
    .eq("position", 50)
    .single();
  if (error || !row) throw error ?? new Error("buyers pos 50 not found");

  const data = row.data as Record<string, unknown>;
  const wrapper = (data.wrapper ?? {}) as Record<string, unknown>;
  // Keep spacing if set; strip the white theme + dark textColor overrides
  // so the block falls back to the natural cream/transparent rendering
  // that gives the cards their golden left-bar accent.
  delete wrapper.theme;
  delete wrapper.textColor;
  if (Object.keys(wrapper).length > 0) data.wrapper = wrapper;
  else delete data.wrapper;

  const { error: upd } = await sb
    .from("page_blocks")
    .update({ data })
    .eq("id", row.id);
  if (upd) throw upd;
  console.log(
    "buyers pos 50 wrapper now:",
    JSON.stringify(data.wrapper ?? null),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
