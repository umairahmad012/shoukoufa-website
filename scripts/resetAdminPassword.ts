/**
 * One-shot admin password reset.
 *   npx tsx scripts/resetAdminPassword.ts <email> <new-password>
 *
 * Bypasses Supabase's email rate limit by using the service-role key to
 * call auth.admin.updateUserById directly. Use sparingly — service-role
 * grants full DB access. Delete this file when done if you want.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
}
loadEnv();

const [, , email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.error("Usage: npx tsx scripts/resetAdminPassword.ts <email> <password>");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  // Look up the user by email — the admin API doesn't have an "update by
  // email" so we fetch UID first.
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) throw listErr;

  const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updErr) throw updErr;

  console.log(`✓ Password reset for ${email}`);
  console.log(`  Sign in at https://samina-bilal-website.netlify.app/admin`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
