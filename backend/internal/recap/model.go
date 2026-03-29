package recap

type MemorySummary struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description,omitempty"`
	AIDescription string   `json:"ai_description,omitempty"`
	MemoryDate    string   `json:"memory_date"`
	LocationName  string   `json:"location_name,omitempty"`
	People        []string `json:"people"`
	CoverURL      string   `json:"cover_url,omitempty"`
	PhotoURLs     []string `json:"photo_urls,omitempty"`
}

type CategoryGroup struct {
	Key      string          `json:"key"`
	Label    string          `json:"label"`
	Emoji    string          `json:"emoji"`
	Count    int             `json:"count"`
	Memories []MemorySummary `json:"memories"`
}

type AvailableMonth struct {
	Year  int `json:"year"`
	Month int `json:"month"`
}

type RecapResponse struct {
	Month         int             `json:"month"`
	Year          int             `json:"year"`
	MonthLabel    string          `json:"month_label"`
	TotalMemories int             `json:"total_memories"`
	TotalPhotos   int             `json:"total_photos"`
	Categories    []CategoryGroup `json:"categories"`
	AIAvailable   bool            `json:"ai_available"`
}
