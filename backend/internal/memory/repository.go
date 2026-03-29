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
	db           *pgxpool.Pool
	mediaBaseURL string
}

func NewRepository(db *pgxpool.Pool, mediaBaseURL string) *Repository {
	return &Repository{db: db, mediaBaseURL: mediaBaseURL}
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
	if err != nil {
		return nil, err
	}
	m.Media, err = r.findMedia(ctx, id)
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
		m.Tags = []string{}
		m.People = []string{}
		m.Media = []MediaItem{}
		memories = append(memories, m)
	}

	if len(memories) > 0 {
		ids := make([]string, len(memories))
		idxByID := make(map[string]int, len(memories))
		for i, m := range memories {
			ids[i] = m.ID
			idxByID[m.ID] = i
		}

		// Load tags
		tagRows, err := r.db.Query(ctx, `SELECT memory_id, tag FROM memory_tags WHERE memory_id = ANY($1)`, ids)
		if err == nil {
			defer tagRows.Close()
			for tagRows.Next() {
				var memID, tag string
				if tagRows.Scan(&memID, &tag) == nil {
					if idx, ok := idxByID[memID]; ok {
						memories[idx].Tags = append(memories[idx].Tags, tag)
					}
				}
			}
		}

		// Load people
		peopleRows, err := r.db.Query(ctx, `SELECT memory_id, person_name FROM memory_people WHERE memory_id = ANY($1)`, ids)
		if err == nil {
			defer peopleRows.Close()
			for peopleRows.Next() {
				var memID, person string
				if peopleRows.Scan(&memID, &person) == nil {
					if idx, ok := idxByID[memID]; ok {
						memories[idx].People = append(memories[idx].People, person)
					}
				}
			}
		}

		// Load media
		if r.mediaBaseURL != "" {
			mediaRows, err := r.db.Query(ctx, `SELECT id, memory_id, media_type, storage_key FROM memory_media WHERE memory_id = ANY($1) ORDER BY created_at ASC`, ids)
			if err == nil {
				defer mediaRows.Close()
				for mediaRows.Next() {
					var id, memID, mediaType, storageKey string
					if mediaRows.Scan(&id, &memID, &mediaType, &storageKey) == nil {
						if idx, ok := idxByID[memID]; ok {
							memories[idx].Media = append(memories[idx].Media, MediaItem{
								ID:        id,
								MediaType: mediaType,
								URL:       r.mediaBaseURL + "/" + storageKey,
							})
						}
					}
				}
			}
		}
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

func (r *Repository) findMedia(ctx context.Context, memoryID string) ([]MediaItem, error) {
	rows, err := r.db.Query(ctx, `SELECT id, media_type, storage_key FROM memory_media WHERE memory_id = $1 ORDER BY created_at ASC`, memoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []MediaItem
	for rows.Next() {
		var item MediaItem
		var storageKey string
		if err := rows.Scan(&item.ID, &item.MediaType, &storageKey); err != nil {
			return nil, err
		}
		item.URL = r.mediaBaseURL + "/" + storageKey
		items = append(items, item)
	}
	if items == nil {
		items = []MediaItem{}
	}
	return items, nil
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

func (r *Repository) AvailableMonths(ctx context.Context, familyID string) ([][2]int, error) {
	rows, err := r.db.Query(ctx, `
		SELECT EXTRACT(YEAR FROM memory_date)::int, EXTRACT(MONTH FROM memory_date)::int
		FROM memories
		WHERE family_id = $1
		GROUP BY 1, 2
		ORDER BY 1 DESC, 2 DESC
	`, familyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result [][2]int
	for rows.Next() {
		var y, m int
		if err := rows.Scan(&y, &m); err != nil {
			return nil, err
		}
		result = append(result, [2]int{y, m})
	}
	return result, nil
}

// suppress unused import
var _ = time.Now
