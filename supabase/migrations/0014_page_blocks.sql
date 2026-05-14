-- Page Builder — block instances per page.
--
-- Each row is one "block" placed on a page. Block types are defined in
-- `lib/blockRegistry.ts`; the `data` column stores type-specific content
-- as JSON whose shape matches the registry entry for that block type.
--
-- Pages render by reading rows for the page_key in `position` order,
-- skipping rows with `enabled = false`.

CREATE TABLE IF NOT EXISTS page_blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key     text NOT NULL,
  block_type   text NOT NULL,
  position     integer NOT NULL DEFAULT 0,
  enabled      boolean NOT NULL DEFAULT true,
  -- Universal block-wrapper props (background image / video / theme)
  -- live alongside content here so a single JSON blob captures the full
  -- block state. Block components read what they care about.
  data         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_blocks_page_position
  ON page_blocks (page_key, position);

CREATE INDEX IF NOT EXISTS idx_page_blocks_enabled
  ON page_blocks (page_key, enabled, position);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_page_blocks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_blocks_updated_at ON page_blocks;
CREATE TRIGGER trg_page_blocks_updated_at
  BEFORE UPDATE ON page_blocks
  FOR EACH ROW EXECUTE FUNCTION set_page_blocks_updated_at();

-- RLS: authenticated team can read/write; service role bypasses (used
-- by the public marketing site to read blocks)
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team can read page_blocks" ON page_blocks;
CREATE POLICY "team can read page_blocks"
  ON page_blocks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "team can write page_blocks" ON page_blocks;
CREATE POLICY "team can write page_blocks"
  ON page_blocks
  TO authenticated
  USING (true)
  WITH CHECK (true);
