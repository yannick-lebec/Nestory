package family

import (
	"context"
	"errors"
	"time"

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

func (r *Repository) FindByUserID(ctx context.Context, userID string) ([]Family, error) {
	rows, err := r.db.Query(ctx, `
		SELECT f.id, f.name, f.created_by, f.created_at
		FROM families f
		JOIN family_members fm ON fm.family_id = f.id
		WHERE fm.user_id = $1
		ORDER BY f.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var families []Family
	for rows.Next() {
		var f Family
		if err := rows.Scan(&f.ID, &f.Name, &f.CreatedBy, &f.CreatedAt); err != nil {
			return nil, err
		}
		families = append(families, f)
	}
	return families, nil
}

func (r *Repository) IsMember(ctx context.Context, familyID, userID string) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM family_members WHERE family_id = $1 AND user_id = $2
	`, familyID, userID).Scan(&count)
	return count > 0, err
}

func (r *Repository) GetMemberRole(ctx context.Context, familyID, userID string) (Role, error) {
	var role Role
	err := r.db.QueryRow(ctx, `
		SELECT role FROM family_members WHERE family_id = $1 AND user_id = $2
	`, familyID, userID).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return role, err
}

func (r *Repository) CreateInvitation(ctx context.Context, inv *Invitation) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO family_invitations (id, family_id, code, role, created_by, created_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, inv.ID, inv.FamilyID, inv.Code, inv.Role, inv.CreatedBy, inv.CreatedAt, inv.ExpiresAt)
	return err
}

func (r *Repository) GetInvitationByCode(ctx context.Context, code string) (*Invitation, error) {
	inv := &Invitation{}
	err := r.db.QueryRow(ctx, `
		SELECT id, family_id, code, role, created_by, created_at, expires_at, used_at, used_by
		FROM family_invitations WHERE code = $1
	`, code).Scan(&inv.ID, &inv.FamilyID, &inv.Code, &inv.Role, &inv.CreatedBy,
		&inv.CreatedAt, &inv.ExpiresAt, &inv.UsedAt, &inv.UsedBy)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return inv, err
}

func (r *Repository) RedeemInvitation(ctx context.Context, code, userID string) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE family_invitations SET used_at = $1, used_by = $2 WHERE code = $3
	`, now, userID, code)
	return err
}

func (r *Repository) ListInvitations(ctx context.Context, familyID string) ([]Invitation, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, family_id, code, role, created_by, created_at, expires_at, used_at, used_by
		FROM family_invitations WHERE family_id = $1 ORDER BY created_at DESC
	`, familyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invs []Invitation
	for rows.Next() {
		var inv Invitation
		if err := rows.Scan(&inv.ID, &inv.FamilyID, &inv.Code, &inv.Role, &inv.CreatedBy,
			&inv.CreatedAt, &inv.ExpiresAt, &inv.UsedAt, &inv.UsedBy); err != nil {
			return nil, err
		}
		invs = append(invs, inv)
	}
	return invs, nil
}
