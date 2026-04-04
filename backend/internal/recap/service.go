package recap

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"nestory/api/internal/memory"
)

var categoryMeta = map[memory.Category]struct{ Label, Emoji string }{
	memory.CategoryAnniversary: {"Anniversaires", "🎂"},
	memory.CategoryVacation:    {"Vacances", "🏖️"},
	memory.CategorySchool:      {"École", "🎒"},
	memory.CategoryEveryday:    {"Quotidien", "☀️"},
	memory.CategoryTrip:        {"Voyages", "✈️"},
	memory.CategoryQuote:       {"Citations", "💬"},
	memory.CategoryAchievement: {"Réussites", "🏆"},
}

var categoryOrder = []memory.Category{
	memory.CategoryVacation,
	memory.CategoryTrip,
	memory.CategoryAnniversary,
	memory.CategoryAchievement,
	memory.CategorySchool,
	memory.CategoryEveryday,
	memory.CategoryQuote,
}

var frenchMonths = [13]string{"", "janvier", "février", "mars", "avril", "mai", "juin",
	"juillet", "août", "septembre", "octobre", "novembre", "décembre"}

type Service struct {
	memorySvc    *memory.Service
	anthropicKey string
}

func NewService(memorySvc *memory.Service, anthropicKey string) *Service {
	return &Service{memorySvc: memorySvc, anthropicKey: anthropicKey}
}

func (s *Service) AvailableMonths(ctx context.Context, familyID string) ([]AvailableMonth, error) {
	pairs, err := s.memorySvc.AvailableMonths(ctx, familyID)
	if err != nil {
		return nil, err
	}
	months := make([]AvailableMonth, len(pairs))
	for i, p := range pairs {
		months[i] = AvailableMonth{Year: p[0], Month: p[1]}
	}
	return months, nil
}

func (s *Service) Generate(ctx context.Context, familyID string, year, month int) (*RecapResponse, error) {
	memories, _, err := s.memorySvc.List(ctx, memory.ListMemoriesFilter{
		FamilyID: familyID,
		Year:     year,
		Month:    month,
		Limit:    200,
	})
	if err != nil {
		return nil, err
	}

	// Build summaries with AI descriptions (parallel, max 3 concurrent)
	summaries := make([]MemorySummary, len(memories))
	totalPhotos := 0
	for i, m := range memories {
		totalPhotos += len(m.Media)
		photoURLs := make([]string, 0, len(m.Media))
		for _, med := range m.Media {
			if med.URL != "" {
				photoURLs = append(photoURLs, med.URL)
			}
		}
		coverURL := ""
		if len(photoURLs) > 0 {
			coverURL = photoURLs[0]
		}
		summaries[i] = MemorySummary{
			ID:           m.ID,
			Title:        m.Title,
			Description:  m.Description,
			MemoryDate:   m.MemoryDate.Format("2006-01-02"),
			LocationName: m.LocationName,
			People:       m.People,
			CoverURL:     coverURL,
			PhotoURLs:    photoURLs,
		}
	}

	// Generate AI description per memory (parallel, max 3 concurrent)
	if s.anthropicKey != "" {
		sem := make(chan struct{}, 3)
		var wg sync.WaitGroup
		for i, m := range memories {
			if len(summaries[i].PhotoURLs) == 0 {
				continue // skip text-only memories
			}
			if summaries[i].Description != "" {
				continue // already has a user comment, no need for AI
			}
			wg.Add(1)
			go func(idx int, mem memory.Memory) {
				defer wg.Done()
				sem <- struct{}{}
				defer func() { <-sem }()

				desc, err := s.describeMemory(ctx, mem)
				if err != nil {
					log.Printf("recap: describe memory %s: %v", mem.ID, err)
					return
				}
				summaries[idx].AIDescription = desc
			}(i, m)
		}
		wg.Wait()
	}

	// Group by category
	groups := map[memory.Category][]MemorySummary{}
	for i, m := range memories {
		groups[m.Category] = append(groups[m.Category], summaries[i])
	}

	var categories []CategoryGroup
	for _, cat := range categoryOrder {
		mems, ok := groups[cat]
		if !ok {
			continue
		}
		meta := categoryMeta[cat]
		categories = append(categories, CategoryGroup{
			Key:      string(cat),
			Label:    meta.Label,
			Emoji:    meta.Emoji,
			Count:    len(mems),
			Memories: mems,
		})
	}

	return &RecapResponse{
		Month:         month,
		Year:          year,
		MonthLabel:    fmt.Sprintf("%s %d", frenchMonths[month], year),
		TotalMemories: len(memories),
		TotalPhotos:   totalPhotos,
		Categories:    categories,
		AIAvailable:   s.anthropicKey != "",
	}, nil
}

func (s *Service) describeMemory(ctx context.Context, m memory.Memory) (string, error) {
	type imageSource struct {
		Type string `json:"type"`
		URL  string `json:"url"`
	}
	type contentBlock struct {
		Type   string       `json:"type"`
		Source *imageSource `json:"source,omitempty"`
		Text   string       `json:"text,omitempty"`
	}

	var content []contentBlock

	// Add up to 3 photos from this memory
	for i, media := range m.Media {
		if i >= 3 {
			break
		}
		if media.URL != "" {
			content = append(content, contentBlock{
				Type:   "image",
				Source: &imageSource{Type: "url", URL: media.URL},
			})
		}
	}

	// Context about the memory
	ctx_text := fmt.Sprintf("Titre : %s", m.Title)
	if m.LocationName != "" {
		ctx_text += fmt.Sprintf("\nLieu : %s", m.LocationName)
	}
	if len(m.People) > 0 {
		ctx_text += fmt.Sprintf("\nPersonnes : %v", m.People)
	}
	if m.Description != "" {
		ctx_text += fmt.Sprintf("\nNote : %s", m.Description)
	}

	prompt := fmt.Sprintf(`Tu es l'assistant du journal de famille Nestory.
Voici un souvenir de famille avec ses photos.

%s

En 1-2 phrases courtes et chaleureuses, décris ce moment en te basant sur ce que tu vois dans les photos.
Sois précis et concret. Commence directement sans formule d'introduction.`, ctx_text)

	content = append(content, contentBlock{Type: "text", Text: prompt})

	type message struct {
		Role    string         `json:"role"`
		Content []contentBlock `json:"content"`
	}
	reqBody, _ := json.Marshal(map[string]any{
		"model":      "claude-haiku-4-5-20251001",
		"max_tokens": 150,
		"messages":   []message{{Role: "user", Content: content}},
	})

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("x-api-key", s.anthropicKey)
	httpReq.Header.Set("anthropic-version", "2023-06-01")
	httpReq.Header.Set("content-type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	res, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return "", fmt.Errorf("anthropic error %d: %s", res.StatusCode, string(body))
	}

	var apiResp struct {
		Content []struct {
			Type string `json:"type"`
			Text string `json:"text"`
		} `json:"content"`
	}
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return "", err
	}
	if len(apiResp.Content) == 0 {
		return "", fmt.Errorf("empty response")
	}
	return apiResp.Content[0].Text, nil
}
