package memory

import "time"

type Category string

const (
	CategoryAnniversary Category = "anniversary"
	CategoryVacation    Category = "vacation"
	CategorySchool      Category = "school"
	CategoryEveryday    Category = "everyday"
	CategoryTrip        Category = "trip"
	CategoryQuote       Category = "quote"
	CategoryAchievement Category = "achievement"
)

type Memory struct {
	ID           string    `json:"id"`
	FamilyID     string    `json:"family_id"`
	AuthorID     string    `json:"author_id"`
	Title        string    `json:"title"`
	Description  string    `json:"description,omitempty"`
	MemoryDate   time.Time `json:"memory_date"`
	LocationName string    `json:"location_name,omitempty"`
	Mood         string    `json:"mood,omitempty"`
	Category     Category  `json:"category"`
	Tags         []string  `json:"tags"`
	People       []string  `json:"people"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateMemoryRequest struct {
	Title        string   `json:"title" binding:"required,min=2,max=200"`
	Description  string   `json:"description"`
	MemoryDate   string   `json:"memory_date" binding:"required"` // ISO 8601
	LocationName string   `json:"location_name"`
	Mood         string   `json:"mood"`
	Category     Category `json:"category" binding:"required"`
	Tags         []string `json:"tags"`
	People       []string `json:"people"`
}

type ListMemoriesFilter struct {
	FamilyID string
	Year     int
	Month    int
	Category Category
	Search   string
	Limit    int
	Offset   int
}
