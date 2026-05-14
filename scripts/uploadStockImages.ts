/**
 * Bulk upload every image in `public/images/{Exterior,interior,Urban City,
 * Sburban : Oldtown}/{Dark*,Light*}/...` to Cloudinary, then insert a row
 * in the `media` table so each image appears in Admin → Media Library.
 *
 * Result: a single index file at `scripts/.uploaded-media-index.json`
 * mapping `<category>_<theme>` → array of media IDs. The follow-up
 * `swapPageBlockImages.ts` reads this index to assign images to blocks.
 *
 *   npx tsx scripts/uploadStockImages.ts
 *
 * Idempotent — checks Supabase for an existing media row by
 * cloudinary_public_id before uploading.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join, basename, extname } from "node:path";
import { Blob } from "node:buffer";

// ---------- env loader ------------------------------------------------------
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

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!CLOUD || !PRESET || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ---------- folder → (category, theme) mapping -----------------------------
type Category = "exterior" | "interior" | "urban" | "suburban";
type Theme = "dark" | "light";

const FOLDERS: Array<{
  rel: string;
  category: Category;
  theme: Theme;
}> = [
  { rel: "Exterior/Dark Exterior", category: "exterior", theme: "dark" },
  { rel: "Exterior/Light Exterior", category: "exterior", theme: "light" },
  { rel: "interior/Dark Interior", category: "interior", theme: "dark" },
  { rel: "interior/Light Interior", category: "interior", theme: "light" },
  { rel: "Urban City/Dark Urban", category: "urban", theme: "dark" },
  { rel: "Urban City/Light Urban", category: "urban", theme: "light" },
  {
    rel: "Sburban : Oldtown/Dark Sburban",
    category: "suburban",
    theme: "dark",
  },
  {
    rel: "Sburban : Oldtown/Light Sburban",
    category: "suburban",
    theme: "light",
  },
];

// ---------- helpers --------------------------------------------------------

function isImageFile(name: string): boolean {
  const ext = extname(name).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
}

function makeAlt(category: Category, theme: Theme, fileBase: string): string {
  // Strip Gemini prefix / numbers — leave a clean descriptor
  const clean = fileBase
    .replace(/^Gemini_Generated_Image_[a-z0-9]+/i, "")
    .replace(/[_.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const subj =
    category === "exterior"
      ? "Home exterior"
      : category === "interior"
        ? "Home interior"
        : category === "urban"
          ? "Urban cityscape"
          : "Suburban neighborhood";
  const tone = theme === "dark" ? "moody, low-light" : "bright, daylight";
  return clean
    ? `${subj} — ${tone} (${clean})`
    : `${subj} — ${tone}`;
}

async function uploadOne(filePath: string): Promise<{
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
}> {
  const buf = readFileSync(filePath);
  const fd = new FormData();
  fd.append("file", new Blob([buf]), basename(filePath));
  fd.append("upload_preset", PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/upload`,
    { method: "POST", body: fd },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  return (await res.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
  };
}

async function findExistingMediaByPublicId(
  publicId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("media")
    .select("id")
    .eq("cloudinary_public_id", publicId)
    .maybeSingle();
  return data?.id ?? null;
}

async function insertMedia(payload: {
  cloudinary_public_id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from("media")
    .insert({
      kind: "image",
      ...payload,
    })
    .select("id")
    .single();
  if (error) throw new Error(`media insert failed: ${error.message}`);
  return data!.id as string;
}

// ---------- main -----------------------------------------------------------

type IndexEntry = { id: string; public_id: string; url: string; alt: string };
type Index = Record<string, IndexEntry[]>; // "category_theme" → entries

async function main() {
  const root = resolve(process.cwd(), "public/images");
  const index: Index = {};

  for (const folder of FOLDERS) {
    const fullDir = join(root, folder.rel);
    let files: string[] = [];
    try {
      files = readdirSync(fullDir).filter(isImageFile);
    } catch {
      console.warn(`  ⚠ folder not found: ${folder.rel}`);
      continue;
    }

    const key = `${folder.category}_${folder.theme}`;
    index[key] ||= [];

    console.log(`\n● ${folder.category} / ${folder.theme}  (${files.length} files)`);

    for (const file of files) {
      const filePath = join(fullDir, file);
      const sizeMb = statSync(filePath).size / 1024 / 1024;
      process.stdout.write(`  • ${file} (${sizeMb.toFixed(1)} MB) ... `);

      // Predict the Cloudinary public_id the preset will assign so we can
      // skip if we already uploaded this file. Preset uses
      //   folder: shoukoufa-website
      //   use_filename: true
      //   unique_filename: true   ← appends a random suffix
      // ⇒ public_id is unpredictable on re-uploads; rely on an *alt-text*
      //    fingerprint instead: skip if a media row with the same alt
      //    already exists.
      const alt = makeAlt(folder.category, folder.theme, file.replace(/\.[^.]+$/, ""));
      const { data: existing } = await supabase
        .from("media")
        .select("id, cloudinary_public_id, url")
        .eq("alt", alt)
        .maybeSingle();
      if (existing) {
        console.log(`already uploaded`);
        index[key].push({
          id: existing.id as string,
          public_id: existing.cloudinary_public_id as string,
          url: existing.url as string,
          alt,
        });
        continue;
      }

      try {
        const up = await uploadOne(filePath);
        const id = await insertMedia({
          cloudinary_public_id: up.public_id,
          url: up.secure_url,
          alt,
          width: up.width,
          height: up.height,
        });
        index[key].push({ id, public_id: up.public_id, url: up.secure_url, alt });
        console.log(`✓ ${up.width}×${up.height}`);
      } catch (e) {
        console.log(`✗ ${(e as Error).message}`);
      }
    }
  }

  // Write the index file for the swap script
  const indexPath = resolve(process.cwd(), "scripts/.uploaded-media-index.json");
  writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`\nIndex written → ${indexPath}`);
  for (const [k, v] of Object.entries(index)) {
    console.log(`  ${k}: ${v.length} images`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
