-- Users
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Families
CREATE TABLE IF NOT EXISTS families (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Family members
CREATE TABLE IF NOT EXISTS family_members (
    id           TEXT PRIMARY KEY,
    family_id    TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('parent', 'child', 'guest')),
    display_name TEXT NOT NULL,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (family_id, user_id)
);

-- Memories
CREATE TABLE IF NOT EXISTS memories (
    id            TEXT PRIMARY KEY,
    family_id     TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    author_id     TEXT NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    description   TEXT,
    memory_date   DATE NOT NULL,
    location_name TEXT,
    mood          TEXT,
    category      TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_family_date ON memories(family_id, memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(family_id, category);

-- Memory media
CREATE TABLE IF NOT EXISTS memory_media (
    id            TEXT PRIMARY KEY,
    memory_id     TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    media_type    TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    storage_key   TEXT NOT NULL,
    thumbnail_key TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags & people
CREATE TABLE IF NOT EXISTS memory_tags (
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    tag       TEXT NOT NULL,
    PRIMARY KEY (memory_id, tag)
);

CREATE TABLE IF NOT EXISTS memory_people (
    memory_id   TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL,
    PRIMARY KEY (memory_id, person_name)
);

-- Recaps
CREATE TABLE IF NOT EXISTS recaps (
    id              TEXT PRIMARY KEY,
    family_id       TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year            INTEGER NOT NULL,
    title           TEXT NOT NULL,
    summary         TEXT NOT NULL,
    cover_image_key TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (family_id, year, month)
);
