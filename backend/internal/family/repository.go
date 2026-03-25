package family

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("family not found")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, f *Family) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO families (id, name, created_by, created_at)
		VALUES ($1, $2, $3, $4)
	`, f.ID, f.Name, f.CreatedBy, f.CreatedAt)
	return err
}

func (r *Repository) FindByID(ctx context.Context, id string) (*Family, error) {
	f := &Family{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, created_by, created_at FROM families WHERE id = $1
	`, id).Scan(&f.ID, &f.Name, &f.CreatedBy, &f.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return f, err
}

func (r *Repository) AddMember(ctx context.Context, m *Member) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO family_members (id, family_id, user_id, role, display_name, joined_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, m.ID, m.FamilyID, m.UserID, m.Role, m.DisplayName, m.JoinedAt)
	return err
}

func (r *Repository) ListMembers(ctx context.Context, familyID string) ([]Member, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, family_id, user_id, role, display_name, joined_at
		FROM family_members WHERE family_id = $1
	`, familyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.ID, &m.FamilyID, &m.UserID, &m.Role, &m.DisplayName, &m.JoinedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func (r *Repository) IsMember(ctx context.Context, familyID, userID string) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM family_members WHERE family_id = $1 AND user_id = $2
	`, familyID, userID).Scan(&count)
	return count > 0, err
}
