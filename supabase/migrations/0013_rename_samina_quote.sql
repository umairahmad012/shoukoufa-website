-- Rename the `samina_quote` column on `communities` to a brand-agnostic
-- `agent_quote`. The field stores the active agent's commentary about
-- each community ("Shoukoufa's Take" in the current UI). The old column
-- name carried the previous agent's first name and is dropped here for
-- portability — the admin UI label is unaffected.

ALTER TABLE communities RENAME COLUMN samina_quote TO agent_quote;
