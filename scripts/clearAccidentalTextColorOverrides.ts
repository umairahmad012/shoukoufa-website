/**
 * Remove any wrapper.textColor overrides currently sitting in
 * page_blocks. We treat them as accidental because the old
 * implementation was too coarse — admin would toggle a section's text
 * color trying to fix a frosted-glass card and end up flipping the
 * section's outer headings too.
 *
 * Now that BlockShell only applies the override class when explicitly
 * set, AND the CSS lifts glass-* panels out of any override, the
 * sensible reset is to clear textColor everywhere. Admins can re-add
 * it on the rare blocks that genuinely need a flip (e.g. cream-themed
 * section under a dark uploaded photo).
 *
 *   npx tsx scripts/clearAccidentalTextColorOverrides.ts
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
  const { data: rows, error } = await sb.from("page_blocks").select("id,page_key,position,block_type,data");
  if (error) throw error;
  if (!rows) return;

  let cleared = 0;
  for (const row of rows) {
    const data = row.data as Record<string, unknown>;
    const wrapper = (data?.wrapper ?? {}) as Record<string, unknown>;
    if (!("textColor" in wrapper)) continue;
    const before = wrapper.textColor;
    delete wrapper.textColor;
    data.wrapper = wrapper;
    const { error: updErr } = await sb.from("page_blocks").update({ data }).eq("id", row.id);
    if (updErr) throw updErr;
    console.log(`  cleared ${row.page_key} pos ${row.position} (${row.block_type}) was: ${String(before)}`);
    cleared += 1;
  }
  console.log(`\nDone. Cleared ${cleared} textColor overrides.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
