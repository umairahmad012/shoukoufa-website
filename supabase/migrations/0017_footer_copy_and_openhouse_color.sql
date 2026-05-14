-- Phase 5 — Two unrelated migrations bundled in one file so we keep the
-- migration count low:
--
--  1) site_settings gains four "Footer Copy" fields so the admin can
--     edit the previously-hardcoded copyright line, design credit,
--     newsletter headline + blurb without a developer.
--
--  2) open_houses gains an optional brand_color column so a single
--     flyer can be re-skinned without changing the global Brand Theme.

-- ─── 1. Footer copy ──────────────────────────────────────────────
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS footer_copyright           text,
  ADD COLUMN IF NOT EXISTS footer_credit              text,
  ADD COLUMN IF NOT EXISTS footer_newsletter_headline text,
  ADD COLUMN IF NOT EXISTS footer_newsletter_blurb    text;

-- ─── 2. Open House brand color ──────────────────────────────────
-- NULL means "use the global Brand Theme primary". Format is a hex
-- string like "#1a3a5f" — validated client-side.
ALTER TABLE open_houses
  ADD COLUMN IF NOT EXISTS brand_color text;
