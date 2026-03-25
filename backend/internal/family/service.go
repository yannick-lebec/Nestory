package family

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

func (s *Service) Create(ctx context.Context, userID string, req CreateFamilyRequest) (*Family, error) {
	f := &Family{
		ID:        uuid.New().String(),
		Name:      req.Name,
		CreatedBy: userID,
		CreatedAt: time.Now(),
	}

	if err := s.repo.Create(ctx, f); err != nil {
		return nil, err
	}

	// Auto-add creator as parent
	member := &Member{
		ID:          uuid.New().String(),
		FamilyID:    f.ID,
		UserID:      userID,
		Role:        RoleParent,
		DisplayName: "Parent",
		JoinedAt:    time.Now(),
	}
	if err := s.repo.AddMember(ctx, member); err != nil {
		return nil, err
	}

	return f, nil
}

func (s *Service) Get(ctx context.Context, familyID string) (*Family, error) {
	return s.repo.FindByID(ctx, familyID)
}

func (s *Service) ListMembers(ctx context.Context, familyID string) ([]Member, error) {
	return s.repo.ListMembers(ctx, familyID)
}

func (s *Service) GetUserFamilies(ctx context.Context, userID string) ([]Family, error) {
	return s.repo.FindByUserID(ctx, userID)
}
