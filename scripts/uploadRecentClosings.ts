/**
 * Upload each photo in `public/images/Recent Closing/` to Cloudinary,
 * insert a media row so it appears in Admin → Media Library, then
 * insert a closings row that references the new media_id.
 *
 * Skips addresses that don't have a matching image file in the folder
 * (per the user's "if there are no images don't post it" rule).
 *
 *   npx tsx scripts/uploadRecentClosings.ts
 *
 * Re-runnable. Existence check uses the filename base inside
 * cloudinary_public_id to avoid double-uploading.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { Blob } from "node:buffer";

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

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const FOLDER = resolve(process.cwd(), "public/images/Recent Closing");

// User-provided list. `image` is the filename in the Recent Closing
// folder. `closed_year` is parsed from the closing date provided by
// the user; entries without a date default to 2026.
const CLOSINGS: Array<{
  image: string;
  address: string;
  city: string;
  state: string;
  closed_year: number;
  display_order: number;
}> = [
  {
    image: "2815 N Capitol St NE washington, DC 20002.webp",
    address: "2815 N Capitol St NE",
    city: "Washington",
    state: "DC",
    closed_year: 2026,
    display_order: 10,
  },
  {
    image: "3 Grace Ct, Stafford, VA 22556.webp",
    address: "3 Grace Ct",
    city: "Stafford",
    state: "VA",
    closed_year: 2026,
    display_order: 20,
  },
  {
    image: "9720 Monarch Rd, Manassas, VA 20110.webp",
    address: "9720 Monarch Rd",
    city: "Manassas",
    state: "VA",
    closed_year: 2026,
    display_order: 30,
  },
  {
    image: "2316 Shadyside Ave suitland, MD 20746.webp",
    address: "2316 Shadyside Ave",
    city: "Suitland",
    state: "MD",
    closed_year: 2026,
    display_order: 40,
  },
  {
    image: "6101 Edsall Rd APT 1004, Alexandria, VA 22304 .webp",
    address: "6101 Edsall Rd, Apt 1004",
    city: "Alexandria",
    state: "VA",
    closed_year: 2026,
    display_order: 50,
  },
  {
    image: "2312 Alstead Ln Bowie, MD, 20716.webp",
    address: "2312 Alstead Ln",
    city: "Bowie",
    state: "MD",
    closed_year: 2026,
    display_order: 60,
  },
];

async function uploadToCloudinary(filePath: string): Promise<{
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}> {
  const buf = readFileSync(filePath);
  const fd = new FormData();
  fd.append("file", new Blob([buf]), filePath.split("/").pop()!);
  fd.append("upload_preset", PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) throw new Error(`upload failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
}

async function findOrCreateMedia(opts: {
  filename: string;
  filePath: string;
  alt: string;
}): Promise<string> {
  const fileBase = opts.filename.replace(/\.[^.]+$/, "").replace(/\s+/g, "_");
  const escaped = fileBase.replace(/[.+()[\]]/g, (m) => `\\${m}`);

  const { data: existing } = await supabase
    .from("media")
    .select("id")
    .ilike("cloudinary_public_id", `%${escaped}%`)
    .maybeSingle();
  if (existing) {
    console.log(`  · already in media: ${existing.id}`);
    return existing.id as string;
  }

  console.log(`  · uploading to Cloudinary…`);
  const up = await uploadToCloudinary(opts.filePath);
  const { data: ins, error } = await supabase
    .from("media")
    .insert({
      kind: "image",
      cloudinary_public_id: up.public_id,
      url: up.secure_url,
      alt: opts.alt,
      width: up.width,
      height: up.height,
    })
    .select("id")
    .single();
  if (error || !ins) throw new Error(error?.message ?? "media insert failed");
  console.log(`  · media id ${ins.id}, ${up.width}×${up.height}`);
  return ins.id as string;
}

async function upsertClosing(opts: {
  image_id: string;
  address: string;
  city: string;
  state: string;
  closed_year: number;
  display_order: number;
}) {
  // No natural unique key — match by (city, state, neighborhood) for idempotency.
  const { data: existing } = await supabase
    .from("closings")
    .select("id")
    .eq("neighborhood", opts.address)
    .eq("city", opts.city)
    .eq("state", opts.state)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("closings")
      .update({
        image_id: opts.image_id,
        closed_year: opts.closed_year,
        display_order: opts.display_order,
        is_visible: true,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return existing.id as string;
  } else {
    const { data, error } = await supabase
      .from("closings")
      .insert({
        image_id: opts.image_id,
        neighborhood: opts.address,
        city: opts.city,
        state: opts.state,
        closed_year: opts.closed_year,
        display_order: opts.display_order,
        is_visible: true,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "insert failed");
    return data.id as string;
  }
}

async function main() {
  console.log("Uploading recent closings…\n");
  let pass = 0;
  let skip = 0;
  for (const c of CLOSINGS) {
    const filePath = join(FOLDER, c.image);
    if (!existsSync(filePath)) {
      console.log(`✗ SKIP "${c.address}" — image not found: ${c.image}`);
      skip += 1;
      continue;
    }
    console.log(`● ${c.address}, ${c.city}, ${c.state}`);
    try {
      const mediaId = await findOrCreateMedia({
        filename: c.image,
        filePath,
        alt: `Closed sale — ${c.address}, ${c.city}, ${c.state}`,
      });
      await upsertClosing({
        image_id: mediaId,
        address: c.address,
        city: c.city,
        state: c.state,
        closed_year: c.closed_year,
        display_order: c.display_order,
      });
      console.log(`  ✓ closing row saved\n`);
      pass += 1;
    } catch (e) {
      console.log(`  ✗ ${(e as Error).message}\n`);
    }
  }

  // Audit available images vs what we posted to flag any extras
  console.log("─── Image folder audit ───");
  const onDisk = readdirSync(FOLDER)
    .filter((f) => f.match(/\.(webp|jpg|jpeg|png)$/i));
  const used = new Set(CLOSINGS.map((c) => c.image));
  for (const f of onDisk) {
    if (!used.has(f)) {
      console.log(`  ⚠ image NOT in user's address list — uploaded but no closing row created: ${f}`);
    }
  }

  console.log(`\nResult: ${pass} closings posted, ${skip} skipped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
