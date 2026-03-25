package media

import "time"

type MediaType string

const (
	MediaTypePhoto MediaType = "photo"
	MediaTypeVideo MediaType = "video"
)

type MemoryMedia struct {
	ID           string    `json:"id"`
	MemoryID     string    `json:"memory_id"`
	MediaType    MediaType `json:"media_type"`
	StorageKey   string    `json:"storage_key"`
	ThumbnailKey string    `json:"thumbnail_key,omitempty"`
	URL          string    `json:"url"`
	CreatedAt    time.Time `json:"created_at"`
}
