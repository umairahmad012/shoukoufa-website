/**
 * Rebuild `scripts/.uploaded-media-index.json` directly from the
 * `media` table using filename fragments to bucket each row.
 *
 * The previous index was poisoned because the alt-text fingerprint
 * collided for Gemini-named files (same alt across an entire bucket),
 * so re-runs of uploadStockImages.ts inserted the same id 11×.
 *
 *   npx tsx scripts/rebuildMediaIndex.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
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

// public_id fragment (case-insensitive) → bucket
const RULES: Array<{ pattern: RegExp; bucket: string }> = [
  // Interior is most specific — match these first
  { pattern: /a[._\s]*dark[._\s]*interior/i, bucket: "interior_dark" },
  { pattern: /b[._\s]*dark[._\s]*interior/i, bucket: "interior_dark" },
  { pattern: /a[._\s]*light[._\s]*interior/i, bucket: "interior_light" },
  { pattern: /light[._\s]*interior[._\s]*kitchen/i, bucket: "interior_light" },

  // Gemini-named files — bucketed by their unique 12-char id fragment
  // (taken from the original public/images/<category>/<theme>/ paths)
  {
    pattern:
      /(2618rb|4auqpe|9ip4lq|aswumi|df3qxm|duv4zw|esg3iz|gc3nfw|npotlb|pwh3tw|ymegmp)/i,
    bucket: "exterior_dark",
  },
  {
    pattern:
      /(end3jc|fp3eno|io60yd|j7jh1q|kg7blw|me0zvt|mwf53o|oibh09|q79v04|uvsq4v)/i,
    bucket: "exterior_light",
  },
  {
    pattern: /(cdfzoc|hj370t|k62y0k|mjpbe6|xga6s3)/i,
    bucket: "urban_dark",
  },
  {
    pattern: /(l1i7st|of80tl|uw1put|vzfs99)/i,
    bucket: "urban_light",
  },
  { pattern: /(frh8cx)/i, bucket: "suburban_dark" },
  {
    pattern: /(2g305d|cln91t|dsi7y8|hvi90q|j0eufq|z6i65e)/i,
    bucket: "suburban_light",
  },
];

async function main() {
  const { data: rows, error } = await supabase
    .from("media")
    .select("id, cloudinary_public_id, url, alt")
    .eq("kind", "image")
    .not("cloudinary_public_id", "is", null);
  if (error || !rows) throw new Error(error?.message ?? "no media");

  const index: Record<string, Array<{ id: string; public_id: string; url: string; alt: string }>> = {};
  const skipped: string[] = [];

  for (const row of rows) {
    const pid = (row.cloudinary_public_id as string) ?? "";
    const match = RULES.find((r) => r.pattern.test(pid));
    if (!match) {
      skipped.push(pid);
      continue;
    }
    index[match.bucket] ||= [];
    index[match.bucket].push({
      id: row.id as string,
      public_id: pid,
      url: row.url as string,
      alt: (row.alt as string) ?? "",
    });
  }

  // De-dupe by id within each bucket (just in case)
  for (const k of Object.keys(index)) {
    const seen = new Set<string>();
    index[k] = index[k].filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }

  const indexPath = resolve(process.cwd(), "scripts/.uploaded-media-index.json");
  writeFileSync(indexPath, JSON.stringify(index, null, 2));

  for (const [k, v] of Object.entries(index)) {
    console.log(`  ${k}: ${v.length} unique images`);
  }
  if (skipped.length) {
    console.log(`\nSkipped (no bucket match): ${skipped.length}`);
    skipped.slice(0, 5).forEach((s) => console.log(`  • ${s}`));
  }
  console.log(`\nIndex rewritten → ${indexPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
