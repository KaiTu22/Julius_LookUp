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

-- =========================================================================
-- Folder hierarchy for organizing lists
-- Supports up to 4 levels of nesting for organizing lists into folders.
-- =========================================================================
CREATE TABLE IF NOT EXISTS folders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID REFERENCES folders(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  depth           INT NOT NULL DEFAULT 1,
  display_order   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT folder_depth_range CHECK (depth >= 1 AND depth <= 4)
);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id
  ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_folders_depth
  ON folders(depth);

-- =========================================================================
-- Folder ancestry for efficient hierarchical queries
-- Closure table: tracks all ancestor-descendant relationships
-- =========================================================================
CREATE TABLE IF NOT EXISTS folder_ancestors (
  descendant_id   UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  ancestor_id     UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  depth           INT NOT NULL,
  PRIMARY KEY (descendant_id, ancestor_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_ancestors_ancestor
  ON folder_ancestors(ancestor_id);

-- =========================================================================
-- Update lists table to support folder organization
-- =========================================================================
ALTER TABLE lists ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lists_folder_id ON lists(folder_id);
