/**
 * One-off cleanup: remove the test `textColor: "light"` override that
 * was placed on home position 45 (quote_pullquote "Why I'm in this
 * work") to verify the new admin Text Color control works. After
 * confirming the override flips the text white on a cream block, this
 * script removes that override so the block returns to the default
 * (auto) behavior.
 *
 * Safe to run multiple times — it's a JSON delete-key operation.
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  throw new Error("Supabase env not set");
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: row, error: readErr } = await sb
    .from("page_blocks")
    .select("id,data")
    .eq("page_key", "home")
    .eq("position", 45)
    .single();
  if (readErr || !row) throw readErr ?? new Error("row missing");

  const data = row.data as Record<string, unknown>;
  const wrapper = (data.wrapper ?? {}) as Record<string, unknown>;
  if (!("textColor" in wrapper)) {
    console.log("home pos 45 — no textColor override to remove, already clean");
    return;
  }
  delete wrapper.textColor;
  data.wrapper = wrapper;

  const { error: updErr } = await sb
    .from("page_blocks")
    .update({ data })
    .eq("id", row.id);
  if (updErr) throw updErr;

  console.log("home pos 45 — textColor override removed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
