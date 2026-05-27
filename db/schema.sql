-- Julius LookUp — Phase 2 schema
-- Run this in Neon's SQL Editor to provision the initial tables.

-- =========================================================================
-- Influencer archive
-- Every influencer ever fetched from Julius is stored here permanently.
-- The full Julius export is kept in raw_data (JSONB) so we never lose
-- anything; common fields are also pulled out as columns for fast querying.
-- =========================================================================
CREATE TABLE IF NOT EXISTS influencers (
  slug              TEXT PRIMARY KEY,
  display_name      TEXT,
  tagline           TEXT,
  avatar_url        TEXT,
  total_followers   BIGINT,
  raw_data          JSONB NOT NULL,
  first_fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencers_display_name
  ON influencers (LOWER(display_name));

CREATE INDEX IF NOT EXISTS idx_influencers_total_followers
  ON influencers (total_followers DESC);

-- =========================================================================
-- Lists / Projects
-- A named collection of influencers, e.g. "Q3 2026 Beauty Campaign".
-- No owner_id yet — single-tenant until we add auth.
-- =========================================================================
CREATE TABLE IF NOT EXISTS lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- List members
-- Many-to-many: which influencers belong to which lists, plus optional notes.
-- =========================================================================
CREATE TABLE IF NOT EXISTS list_members (
  list_id          UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  influencer_slug  TEXT NOT NULL REFERENCES influencers(slug),
  notes            TEXT,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, influencer_slug)
);

CREATE INDEX IF NOT EXISTS idx_list_members_influencer
  ON list_members (influencer_slug);
