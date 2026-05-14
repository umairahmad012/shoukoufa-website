-- Phase 6 — Email notification settings.
--
-- When a visitor submits any form (Contact, Valuation, custom form,
-- Open House RSVP) the realtor receives an email so they don't have to
-- log into the admin panel to know there's a new lead.
--
-- Email is sent from Brand Bonjour's verified Resend domain (no DNS
-- work at the realtor end). The fields below let the admin control:
--
--   • Where the notification email is sent (`notification_email`).
--   • Optional CC recipient (`notification_cc`) — useful for assistants /
--     team members who should also see leads.
--   • Per-source toggles so the admin can mute notifications for a
--     specific surface without breaking the form itself.

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS notification_email        text,
  ADD COLUMN IF NOT EXISTS notification_cc           text,
  ADD COLUMN IF NOT EXISTS notify_contact            boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_valuation          boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_forms              boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_rsvp               boolean NOT NULL DEFAULT true;
