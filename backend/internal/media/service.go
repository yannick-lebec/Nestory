package media

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo    *Repository
	storage *Storage
}

func NewService(repo *Repository, storage *Storage) *Service {
	return &Service{repo: repo, storage: storage}
}

func (s *Service) Upload(ctx context.Context, memoryID string, filename string, r io.Reader, size int64, contentType string) (*MemoryMedia, error) {
	mediaType := MediaTypePhoto
	if isVideo(contentType) {
		mediaType = MediaTypeVideo
	}

	ext := extensionFromContentType(contentType)
	key := fmt.Sprintf("memories/%s/%s%s", memoryID, uuid.New().String(), ext)

	if err := s.storage.Upload(ctx, key, r, size, contentType); err != nil {
		return nil, fmt.Errorf("storage upload failed: %w", err)
	}

	m := &MemoryMedia{
		ID:        uuid.New().String(),
		MemoryID:  memoryID,
		MediaType: mediaType,
		StorageKey: key,
		URL:       s.storage.PublicURL(key),
		CreatedAt: time.Now(),
	}

	if err := s.repo.Create(ctx, m); err != nil {
		// Best-effort cleanup
		_ = s.storage.Delete(ctx, key)
		return nil, err
	}

	return m, nil
}

func (s *Service) ListByMemory(ctx context.Context, memoryID string) ([]MemoryMedia, error) {
	media, err := s.repo.FindByMemoryID(ctx, memoryID)
	if err != nil {
		return nil, err
	}
	for i := range media {
		media[i].URL = s.storage.PublicURL(media[i].StorageKey)
	}
	return media, nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	key, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	return s.storage.Delete(ctx, key)
}

func isVideo(ct string) bool {
	return ct == "video/mp4" || ct == "video/quicktime" || ct == "video/webm"
}

func extensionFromContentType(ct string) string {
	switch ct {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	case "video/mp4":
		return ".mp4"
	case "video/quicktime":
		return ".mov"
	default:
		return ""
	}
}
