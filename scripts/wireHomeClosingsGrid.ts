/**
 * Replace the homepage "Recent Closings" cta_band TEASER (pos 70) with
 * a real `closings_grid` block in preview mode. Preview mode shows the
 * first 6 closings + a "See All Closings" link.
 *
 * Idempotent — re-running is safe.
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
    .select("id,block_type,data")
    .eq("page_key", "home")
    .eq("position", 70)
    .single();
  if (error || !row) throw error ?? new Error("home pos 70 not found");

  if (row.block_type === "closings_grid") {
    const d = row.data as Record<string, unknown>;
    if (d.mode === "preview") {
      console.log("home pos 70 — already closings_grid in preview mode, nothing to do");
      return;
    }
    // already a closings_grid but wrong mode — just flip it
    const { error: updErr } = await sb
      .from("page_blocks")
      .update({ data: { ...d, mode: "preview" } })
      .eq("id", row.id);
    if (updErr) throw updErr;
    console.log("home pos 70 — flipped closings_grid to preview mode");
    return;
  }

  const oldData = row.data as Record<string, unknown>;
  const newData = {
    eyebrow: typeof oldData.eyebrow === "string" ? oldData.eyebrow : "Recent Closings",
    heading:
      typeof oldData.heading === "string" && oldData.heading.length > 0
        ? oldData.heading
        : "A glimpse at recent work.",
    subtitle:
      typeof oldData.body === "string" && oldData.body.length > 0
        ? oldData.body
        : "A few of the homes I've helped families buy and sell across the DMV.",
    mode: "preview" as const,
    wrapper: { spacing: "large" as const, theme: "cream" as const },
  };

  const { error: updErr } = await sb
    .from("page_blocks")
    .update({ block_type: "closings_grid", data: newData })
    .eq("id", row.id);
  if (updErr) throw updErr;

  console.log("home pos 70 — converted cta_band → closings_grid (preview mode, 6 items + See All)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
