CREATE TABLE IF NOT EXISTS family_invitations (
    id         TEXT PRIMARY KEY,
    family_id  TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    code       VARCHAR(8) UNIQUE NOT NULL,
    role       TEXT NOT NULL CHECK (role IN ('parent', 'child', 'guest')),
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    used_by    TEXT REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON family_invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_family ON family_invitations(family_id);
