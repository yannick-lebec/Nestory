package media

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, m *MemoryMedia) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO memory_media (id, memory_id, media_type, storage_key, thumbnail_key, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, m.ID, m.MemoryID, m.MediaType, m.StorageKey, m.ThumbnailKey, m.CreatedAt)
	return err
}

func (r *Repository) FindByMemoryID(ctx context.Context, memoryID string) ([]MemoryMedia, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, memory_id, media_type, storage_key, thumbnail_key, created_at
		FROM memory_media WHERE memory_id = $1 ORDER BY created_at ASC
	`, memoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []MemoryMedia
	for rows.Next() {
		var m MemoryMedia
		if err := rows.Scan(&m.ID, &m.MemoryID, &m.MediaType, &m.StorageKey, &m.ThumbnailKey, &m.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, m)
	}
	return result, nil
}

func (r *Repository) Delete(ctx context.Context, id string) (string, error) {
	var key string
	err := r.db.QueryRow(ctx, `
		DELETE FROM memory_media WHERE id = $1 RETURNING storage_key
	`, id).Scan(&key)
	return key, err
}
