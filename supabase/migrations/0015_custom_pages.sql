-- Custom pages — admin-created marketing pages addressable at /<slug>.
--
-- Each row is one custom page. The Page Builder's `page_blocks` table
-- is keyed off `page_key`, which for custom pages is just the slug.
-- A dynamic Next.js route at app/[slug] looks up rows here, renders
-- the page when `published = true`, and 404s otherwise.
--
-- Reserved slugs (existing route folders) are enforced in app code,
-- not at the DB level, so dev can rename routes later without breaking
-- the constraint.

CREATE TABLE IF NOT EXISTS pages (
  slug          text PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  published     boolean NOT NULL DEFAULT false,
  show_in_nav   boolean NOT NULL DEFAULT false,
  nav_order     integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_nav
  ON pages (show_in_nav, nav_order)
  WHERE published = true;

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_pages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_updated_at ON pages;
CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_pages_updated_at();

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team can read pages" ON pages;
CREATE POLICY "team can read pages"
  ON pages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "team can write pages" ON pages;
CREATE POLICY "team can write pages"
  ON pages
  TO authenticated
  USING (true)
  WITH CHECK (true);
