package memory

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, familyID, authorID string, req CreateMemoryRequest) (*Memory, error) {
	memDate, err := time.Parse("2006-01-02", req.MemoryDate)
	if err != nil {
		return nil, err
	}

	m := &Memory{
		ID:           uuid.New().String(),
		FamilyID:     familyID,
		AuthorID:     authorID,
		Title:        req.Title,
		Description:  req.Description,
		MemoryDate:   memDate,
		LocationName: req.LocationName,
		Mood:         req.Mood,
		Category:     req.Category,
		Tags:         req.Tags,
		People:       req.People,
		CreatedAt:    time.Now(),
	}

	if m.Tags == nil {
		m.Tags = []string{}
	}
	if m.People == nil {
		m.People = []string{}
	}

	if err := s.repo.Create(ctx, m); err != nil {
		return nil, err
	}

	return m, nil
}

func (s *Service) Get(ctx context.Context, id string) (*Memory, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *Service) List(ctx context.Context, f ListMemoriesFilter) ([]Memory, int, error) {
	return s.repo.List(ctx, f)
}

func (s *Service) Delete(ctx context.Context, id, familyID string) error {
	return s.repo.Delete(ctx, id, familyID)
}

func (s *Service) AvailableMonths(ctx context.Context, familyID string) ([][2]int, error) {
	return s.repo.AvailableMonths(ctx, familyID)
}
