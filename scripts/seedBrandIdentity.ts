/**
 * One-off seed: upsert content_blocks(page=brand, key=identity) with the
 * brand defaults so the public site + admin form ship with real data, not
 * blanks.
 *
 *   npx tsx scripts/seedBrandIdentity.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Tiny .env.local loader (no dotenv dependency)
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
    // ignore — env may already be set in shell
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BRAND = {
  name: "Shoukoufa Aboubakri",
  role: "Real Estate Specialist",
  brokerage: "REMAX Galaxy",
  tagline: "Building Legacies, One House at a Time",
  serviceArea: "Virginia · Maryland · D.C.",
  languages: ["English"],
};

async function main() {
  const { data, error } = await supabase
    .from("content_blocks")
    .upsert(
      {
        page: "brand",
        key: "identity",
        value: JSON.stringify(BRAND),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page,key" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("Upsert failed:", error.message);
    process.exit(1);
  }
  console.log(`✓ brand.identity seeded (block id: ${data?.id})`);
  console.log(BRAND);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
