/**
 * Daily Google reviews sync cron.
 *
 *   GET /api/cron/sync-google-reviews
 *
 * Schedule:
 *   Vercel:   add to vercel.json crons → "0 13 * * *"  (8am ET / 1pm UTC)
 *   Netlify:  netlify.toml [build.processing] / scheduled function
 *   Supabase: pg_cron job that hits this URL
 *
 * Auth:
 *   Requires header `x-cron-secret: <env CRON_SECRET>` so random visitors
 *   can't trigger syncs. The cron platform sets this header. If CRON_SECRET
 *   isn't set in env, requests are rejected (fail-closed).
 *
 * The endpoint just delegates to `syncGoogleReviewsNow()` so the same
 * code path as the manual "Sync now" admin button is exercised — single
 * source of truth for the sync logic.
 */

import { NextResponse } from "next/server";
import { syncGoogleReviewsNow } from "@/app/admin/integrations/google/actions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured." },
      { status: 503 },
    );
  }
  const auth = req.headers.get("x-cron-secret");
  if (auth !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const res = await syncGoogleReviewsNow();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
