-- Site-wide settings — single-row table that holds everything we used
-- to hardcode in `lib/site.ts` (phone, email, social URLs, licenses,
-- brokerage office, fixed-nav visibility/order).
--
-- Why a single row instead of key/value? Most of these values are
-- always read together (footer renders all of them at once), and a
-- flat columnar schema is easier to edit via a typed admin form.
--
-- Defaults match the values previously hardcoded so the public site
-- continues to render correctly even on a fresh DB.

CREATE TABLE IF NOT EXISTS site_settings (
  id                              integer PRIMARY KEY DEFAULT 1,

  -- Direct contact
  phone                           text,
  phone_href                      text,
  email                           text,
  email_href                      text,

  -- Brokerage office (footer card)
  brokerage_office_name           text,
  brokerage_office_street         text,
  brokerage_office_city_state_zip text,
  brokerage_office_phone          text,
  brokerage_office_phone_href     text,

  -- Licenses (footer copyright + Direct Contact block + About page)
  license_va                      text,
  license_md                      text,
  license_dc                      text,

  -- Social
  instagram_url                   text,
  facebook_url                    text,
  tiktok_url                      text,
  youtube_url                     text,
  linkedin_url                    text,

  -- Header / drawer nav configuration. Each entry is
  --   { key: 'home'|'about'|'buyers'|..., enabled: boolean, order: int, label?: string }
  -- The renderer falls back to default labels when label is null.
  -- Custom pages still come from the `pages` table (show_in_nav flag).
  fixed_nav                       jsonb NOT NULL DEFAULT '[]'::jsonb,

  updated_at                      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT singleton CHECK (id = 1)
);

-- Seed a single row with current defaults. Idempotent.
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

UPDATE site_settings
SET
  phone                           = COALESCE(phone, '(703) 307-0889'),
  phone_href                      = COALESCE(phone_href, 'tel:+17033070889'),
  email                           = COALESCE(email, 'realtor@shoukoufahomes.com'),
  email_href                      = COALESCE(email_href, 'mailto:realtor@shoukoufahomes.com'),
  brokerage_office_name           = COALESCE(brokerage_office_name, 'REMAX Galaxy'),
  brokerage_office_street         = COALESCE(brokerage_office_street, '8100 Boone Blvd, Suite 260'),
  brokerage_office_city_state_zip = COALESCE(brokerage_office_city_state_zip, 'Vienna, VA 22182'),
  brokerage_office_phone          = COALESCE(brokerage_office_phone, '(703) 821-1840'),
  brokerage_office_phone_href     = COALESCE(brokerage_office_phone_href, 'tel:+17038211840'),
  license_va                      = COALESCE(license_va, '0225231001'),
  license_md                      = COALESCE(license_md, '5006551'),
  license_dc                      = COALESCE(license_dc, 'SP40001379'),
  instagram_url                   = COALESCE(instagram_url, 'https://www.instagram.com/realtorshoukoufa_dmv/'),
  facebook_url                    = COALESCE(facebook_url, 'https://www.facebook.com/ShoukoufaHomes/'),
  tiktok_url                      = COALESCE(tiktok_url, 'https://www.tiktok.com/@shoukoufahomes_')
WHERE id = 1;

-- Seed the fixed_nav with the current order/labels if empty
UPDATE site_settings
SET fixed_nav = '[
  {"key":"home","label":"Home","enabled":true,"order":10},
  {"key":"about","label":"About","enabled":true,"order":20},
  {"key":"buyers","label":"Buyers","enabled":true,"order":30},
  {"key":"sellers","label":"Sellers","enabled":true,"order":40},
  {"key":"invest","label":"Invest","enabled":true,"order":50},
  {"key":"communities","label":"Communities","enabled":true,"order":60},
  {"key":"closings","label":"Recent Closings","enabled":true,"order":70},
  {"key":"partners","label":"Trusted Partners","enabled":true,"order":80},
  {"key":"reviews","label":"Reviews","enabled":true,"order":90},
  {"key":"contact","label":"Contact","enabled":true,"order":100}
]'::jsonb
WHERE id = 1 AND (fixed_nav IS NULL OR fixed_nav = '[]'::jsonb);

-- Per-page metadata for the 10 fixed pages (title + meta description).
-- Custom pages already hold metadata in the `pages` table; this is the
-- equivalent for the routes that don't have a row there.
CREATE TABLE IF NOT EXISTS page_meta (
  page_key    text PRIMARY KEY,
  title       text NOT NULL,
  description text,
  og_image_id uuid REFERENCES media(id) ON DELETE SET NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO page_meta (page_key, title, description) VALUES
  ('home',        'Shoukoufa Aboubakri | Real Estate Specialist · Virginia · Maryland · D.C.', 'Building legacies, one house at a time. Shoukoufa Aboubakri is a licensed Real Estate Specialist with REMAX Galaxy, serving the DMV — Virginia, Maryland, and Washington D.C.'),
  ('about',       'About Shoukoufa Aboubakri | REMAX Galaxy Real Estate Specialist — VA, MD & DC', 'Shoukoufa Aboubakri is a Real Estate Specialist with REMAX Galaxy, licensed in Virginia, Maryland, and Washington D.C. Based in Northern Virginia.'),
  ('buyers',      'Buying a Home | Shoukoufa Aboubakri — VA, MD & DC Buyer''s Agent', 'First home or fifth — Shoukoufa makes the buying process feel calm. Local market knowledge, sharp negotiation, end-to-end representation across the DMV.'),
  ('sellers',     'Selling a Home | Shoukoufa Aboubakri — VA, MD & DC Listing Agent', 'Pricing strategy, professional marketing, and negotiation that protects you. Boutique listing representation across the DMV.'),
  ('invest',      'Invest | Shoukoufa Aboubakri', 'Investment property guidance across the DMV — strategy, diligence, and acquisition support for first-time and seasoned investors.'),
  ('communities', 'Communities | Northern Virginia Real Estate', 'Six Northern Virginia neighborhoods Shoukoufa knows by street name. Real 2026 market data for Alexandria, Arlington, Vienna, McLean, Falls Church, and Great Falls.'),
  ('closings',    'Recent Closings | Shoukoufa Aboubakri', 'Every home Shoukoufa personally represented at the closing table across the DMV.'),
  ('reviews',     'Reviews | Shoukoufa Aboubakri', 'Client reviews and testimonials.'),
  ('partners',    'Trusted Partners | Shoukoufa Aboubakri', 'The lenders, inspectors, insurance agents, and trades Shoukoufa trusts with her own clients. Real names, real contact info, no kickbacks.'),
  ('contact',     'Contact | Shoukoufa Aboubakri', 'Get in touch with Shoukoufa Aboubakri — Real Estate Specialist at REMAX Galaxy. Licensed in Virginia, Maryland, and Washington D.C.'),
  ('privacy',     'Privacy Policy & Disclaimers | Shoukoufa Aboubakri', 'Privacy policy, real estate disclaimers, and terms for shoukoufahomes.com.')
ON CONFLICT (page_key) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION set_site_settings_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_site_settings_updated_at();

CREATE OR REPLACE FUNCTION set_page_meta_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_page_meta_updated_at ON page_meta;
CREATE TRIGGER trg_page_meta_updated_at
  BEFORE UPDATE ON page_meta
  FOR EACH ROW EXECUTE FUNCTION set_page_meta_updated_at();

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_meta     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team can read site_settings" ON site_settings;
CREATE POLICY "team can read site_settings" ON site_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "team can write site_settings" ON site_settings;
CREATE POLICY "team can write site_settings" ON site_settings TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "team can read page_meta" ON page_meta;
CREATE POLICY "team can read page_meta" ON page_meta FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "team can write page_meta" ON page_meta;
CREATE POLICY "team can write page_meta" ON page_meta TO authenticated USING (true) WITH CHECK (true);
