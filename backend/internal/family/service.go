package family

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var ErrInvalidCode = errors.New("invitation code invalid or expired")
var ErrAlreadyMember = errors.New("already a member of this family")

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

func (s *Service) GenerateInvite(ctx context.Context, familyID, userID string, req GenerateInviteRequest) (*Invitation, error) {
	// Only parents can invite
	role, err := s.repo.GetMemberRole(ctx, familyID, userID)
	if err != nil || role != RoleParent {
		return nil, errors.New("only parents can create invitations")
	}

	code, err := generateCode()
	if err != nil {
		return nil, err
	}

	inv := &Invitation{
		ID:        uuid.New().String(),
		FamilyID:  familyID,
		Code:      code,
		Role:      req.Role,
		CreatedBy: userID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	if err := s.repo.CreateInvitation(ctx, inv); err != nil {
		return nil, err
	}
	return inv, nil
}

func (s *Service) JoinByCode(ctx context.Context, userID, code string) (*Family, error) {
	inv, err := s.repo.GetInvitationByCode(ctx, code)
	if err != nil {
		return nil, ErrInvalidCode
	}
	if inv.UsedAt != nil || time.Now().After(inv.ExpiresAt) {
		return nil, ErrInvalidCode
	}

	already, _ := s.repo.IsMember(ctx, inv.FamilyID, userID)
	if already {
		return nil, ErrAlreadyMember
	}

	member := &Member{
		ID:          uuid.New().String(),
		FamilyID:    inv.FamilyID,
		UserID:      userID,
		Role:        inv.Role,
		DisplayName: "Membre",
		JoinedAt:    time.Now(),
	}
	if err := s.repo.AddMember(ctx, member); err != nil {
		return nil, err
	}
	if err := s.repo.RedeemInvitation(ctx, code, userID); err != nil {
		return nil, err
	}

	return s.repo.FindByID(ctx, inv.FamilyID)
}

func (s *Service) ListInvitations(ctx context.Context, familyID, userID string) ([]Invitation, error) {
	role, err := s.repo.GetMemberRole(ctx, familyID, userID)
	if err != nil || role != RoleParent {
		return nil, errors.New("only parents can view invitations")
	}
	return s.repo.ListInvitations(ctx, familyID)
}

func generateCode() (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return strings.ToUpper(hex.EncodeToString(b)), nil
}
