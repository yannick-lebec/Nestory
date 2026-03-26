package importer

import "time"

// UploadedPhoto is a photo that has been uploaded to S3 during analyze.
type UploadedPhoto struct {
	ID          string    `json:"id"`
	StorageKey  string    `json:"storage_key"`
	URL         string    `json:"url"`
	TakenAt     time.Time `json:"taken_at"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"-"`
}

// ProposedGroup is a suggested memory from a set of photos taken on the same day.
type ProposedGroup struct {
	Date   string          `json:"date"`   // YYYY-MM-DD
	Title  string          `json:"title"`  // e.g. "15 août 2024"
	Photos []UploadedPhoto `json:"photos"`
}

// AnalyzeResponse is returned by POST /import/analyze.
type AnalyzeResponse struct {
	SessionID string          `json:"session_id"`
	Groups    []ProposedGroup `json:"groups"`
	Total     int             `json:"total"`
}

// ConfirmGroup is one group the user wants to save as a memory.
type ConfirmGroup struct {
	Date       string   `json:"date"`        // YYYY-MM-DD
	Title      string   `json:"title"`       // memory title
	Category   string   `json:"category"`    // memory category
	PhotoIDs   []string `json:"photo_ids"`   // IDs from UploadedPhoto
}

// ConfirmRequest is the body of POST /import/confirm.
type ConfirmRequest struct {
	SessionID string         `json:"session_id"`
	Groups    []ConfirmGroup `json:"groups"`
}

// ConfirmResponse reports how many memories were created.
type ConfirmResponse struct {
	Created int `json:"created"`
}
