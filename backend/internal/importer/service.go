package importer

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rwcarlsen/goexif/exif"

	"nestory/api/internal/media"
)

type Service struct {
	db      *pgxpool.Pool
	storage *media.Storage
	// in-memory session store: sessionID -> map[photoID]UploadedPhoto
	sessions map[string]map[string]UploadedPhoto
}

func NewService(db *pgxpool.Pool, storage *media.Storage) *Service {
	return &Service{
		db:       db,
		storage:  storage,
		sessions: make(map[string]map[string]UploadedPhoto),
	}
}

// Analyze uploads all files and groups them by day based on EXIF date.
func (s *Service) Analyze(ctx context.Context, files []*multipart.FileHeader) (*AnalyzeResponse, error) {
	sessionID := uuid.New().String()
	photoMap := make(map[string]UploadedPhoto, len(files))

	for _, fh := range files {
		f, err := fh.Open()
		if err != nil {
			continue
		}

		// Read all bytes so we can parse EXIF then re-upload
		data, err := io.ReadAll(f)
		f.Close()
		if err != nil {
			continue
		}

		contentType := fh.Header.Get("Content-Type")
		if contentType == "" {
			contentType = "image/jpeg"
		}
		if !isAllowedType(contentType) {
			continue
		}

		takenAt := extractDate(data)
		ext := extFromContentType(contentType)
		photoID := uuid.New().String()
		key := fmt.Sprintf("import/%s/%s%s", sessionID, photoID, ext)

		if err := s.storage.Upload(ctx, key, bytes.NewReader(data), int64(len(data)), contentType); err != nil {
			log.Printf("importer: upload failed for %s: %v", fh.Filename, err)
			continue
		}

		photoMap[photoID] = UploadedPhoto{
			ID:          photoID,
			StorageKey:  key,
			URL:         s.storage.PublicURL(key),
			TakenAt:     takenAt,
			Filename:    fh.Filename,
			ContentType: contentType,
		}
	}

	s.sessions[sessionID] = photoMap

	log.Printf("importer: analyze done — %d/%d files uploaded, %d groups", len(photoMap), len(files), len(groupByDay(photoMap)))

	groups := groupByDay(photoMap)
	return &AnalyzeResponse{
		SessionID: sessionID,
		Groups:    groups,
		Total:     len(photoMap),
	}, nil
}

// Confirm creates memories and their media records from confirmed groups.
func (s *Service) Confirm(ctx context.Context, familyID, authorID string, req ConfirmRequest) (*ConfirmResponse, error) {
	photoMap := s.sessions[req.SessionID]

	created := 0
	for _, g := range req.Groups {
		if len(g.PhotoIDs) == 0 {
			continue
		}

		memDate, err := time.Parse("2006-01-02", g.Date)
		if err != nil {
			memDate = time.Now()
		}

		category := g.Category
		if category == "" {
			category = "everyday"
		}

		memoryID := uuid.New().String()
		_, err = s.db.Exec(ctx, `
			INSERT INTO memories (id, family_id, author_id, title, description, memory_date,
				location_name, mood, category, created_at)
			VALUES ($1, $2, $3, $4, '', $5, '', '', $6, $7)
		`, memoryID, familyID, authorID, g.Title, memDate, category, time.Now())
		if err != nil {
			continue
		}

		for _, photoID := range g.PhotoIDs {
			photo, ok := photoMap[photoID]
			if !ok {
				continue
			}

			mediaType := "photo"
			if strings.HasPrefix(photo.ContentType, "video/") {
				mediaType = "video"
			}

			s.db.Exec(ctx, `
				INSERT INTO memory_media (id, memory_id, media_type, storage_key, thumbnail_key, created_at)
				VALUES ($1, $2, $3, $4, '', $5)
			`, uuid.New().String(), memoryID, mediaType, photo.StorageKey, photo.TakenAt)
		}

		created++
	}

	delete(s.sessions, req.SessionID)
	return &ConfirmResponse{Created: created}, nil
}

func groupByDay(photos map[string]UploadedPhoto) []ProposedGroup {
	byDay := make(map[string][]UploadedPhoto)
	for _, p := range photos {
		day := p.TakenAt.Format("2006-01-02")
		byDay[day] = append(byDay[day], p)
	}

	groups := make([]ProposedGroup, 0, len(byDay))
	for day, photos := range byDay {
		sort.Slice(photos, func(i, j int) bool {
			return photos[i].TakenAt.Before(photos[j].TakenAt)
		})
		t, _ := time.Parse("2006-01-02", day)
		groups = append(groups, ProposedGroup{
			Date:   day,
			Title:  formatFrenchDate(t),
			Photos: photos,
		})
	}

	sort.Slice(groups, func(i, j int) bool {
		return groups[i].Date < groups[j].Date
	})

	return groups
}

func extractDate(data []byte) time.Time {
	x, err := exif.Decode(bytes.NewReader(data))
	if err == nil {
		if t, err := x.DateTime(); err == nil {
			return t
		}
	}
	return time.Now()
}

func formatFrenchDate(t time.Time) string {
	months := []string{"", "janvier", "février", "mars", "avril", "mai", "juin",
		"juillet", "août", "septembre", "octobre", "novembre", "décembre"}
	return fmt.Sprintf("%d %s %d", t.Day(), months[t.Month()], t.Year())
}

func isAllowedType(ct string) bool {
	switch ct {
	case "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
		"video/mp4", "video/quicktime", "video/webm":
		return true
	}
	return false
}

func extFromContentType(ct string) string {
	switch ct {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/heic", "image/heif":
		return ".heic"
	case "video/mp4":
		return ".mp4"
	case "video/quicktime":
		return ".mov"
	default:
		return ""
	}
}
