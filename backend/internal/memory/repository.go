package memory

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("memory not found")

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, m *Memory) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO memories (id, family_id, author_id, title, description, memory_date,
			location_name, mood, category, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, m.ID, m.FamilyID, m.AuthorID, m.Title, m.Description, m.MemoryDate,
		m.LocationName, m.Mood, m.Category, m.CreatedAt)
	if err != nil {
		return err
	}

	for _, tag := range m.Tags {
		if _, err := tx.Exec(ctx, `
			INSERT INTO memory_tags (memory_id, tag) VALUES ($1, $2)
		`, m.ID, tag); err != nil {
			return err
		}
	}

	for _, person := range m.People {
		if _, err := tx.Exec(ctx, `
			INSERT INTO memory_people (memory_id, person_name) VALUES ($1, $2)
		`, m.ID, person); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *Repository) FindByID(ctx context.Context, id string) (*Memory, error) {
	m := &Memory{}
	err := r.db.QueryRow(ctx, `
		SELECT id, family_id, author_id, title, description, memory_date,
			location_name, mood, category, created_at
		FROM memories WHERE id = $1
	`, id).Scan(&m.ID, &m.FamilyID, &m.AuthorID, &m.Title, &m.Description,
		&m.MemoryDate, &m.LocationName, &m.Mood, &m.Category, &m.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	m.Tags, err = r.findTags(ctx, id)
	if err != nil {
		return nil, err
	}
	m.People, err = r.findPeople(ctx, id)
	return m, err
}

func (r *Repository) List(ctx context.Context, f ListMemoriesFilter) ([]Memory, int, error) {
	where := []string{"m.family_id = $1"}
	args := []any{f.FamilyID}
	i := 2

	if f.Year > 0 {
		where = append(where, fmt.Sprintf("EXTRACT(YEAR FROM m.memory_date) = $%d", i))
		args = append(args, f.Year)
		i++
	}
	if f.Month > 0 {
		where = append(where, fmt.Sprintf("EXTRACT(MONTH FROM m.memory_date) = $%d", i))
		args = append(args, f.Month)
		i++
	}
	if f.Category != "" {
		where = append(where, fmt.Sprintf("m.category = $%d", i))
		args = append(args, f.Category)
		i++
	}
	if f.Search != "" {
		where = append(where, fmt.Sprintf("(m.title ILIKE $%d OR m.description ILIKE $%d)", i, i))
		args = append(args, "%"+f.Search+"%")
		i++
	}

	limit := f.Limit
	if limit == 0 {
		limit = 20
	}

	query := fmt.Sprintf(`
		SELECT m.id, m.family_id, m.author_id, m.title, m.description, m.memory_date,
			m.location_name, m.mood, m.category, m.created_at
		FROM memories m
		WHERE %s
		ORDER BY m.memory_date DESC
		LIMIT $%d OFFSET $%d
	`, strings.Join(where, " AND "), i, i+1)

	args = append(args, limit, f.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var memories []Memory
	for rows.Next() {
		var m Memory
		if err := rows.Scan(&m.ID, &m.FamilyID, &m.AuthorID, &m.Title, &m.Description,
			&m.MemoryDate, &m.LocationName, &m.Mood, &m.Category, &m.CreatedAt); err != nil {
			return nil, 0, err
		}
		memories = append(memories, m)
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM memories m WHERE %s", strings.Join(where[:len(where)], " AND "))
	_ = r.db.QueryRow(ctx, countQuery, args[:i-1]...).Scan(&total)

	return memories, total, nil
}

func (r *Repository) Delete(ctx context.Context, id, familyID string) error {
	tag, err := r.db.Exec(ctx, `
		DELETE FROM memories WHERE id = $1 AND family_id = $2
	`, id, familyID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) findTags(ctx context.Context, memoryID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `SELECT tag FROM memory_tags WHERE memory_id = $1`, memoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tags []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		tags = append(tags, t)
	}
	return tags, nil
}

func (r *Repository) findPeople(ctx context.Context, memoryID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `SELECT person_name FROM memory_people WHERE memory_id = $1`, memoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var people []string
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		people = append(people, p)
	}
	return people, nil
}

// suppress unused import
var _ = time.Now
