package family

import "time"

type Role string

const (
	RoleParent Role = "parent"
	RoleChild  Role = "child"
	RoleGuest  Role = "guest"
)

type Family struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

type Member struct {
	ID          string    `json:"id"`
	FamilyID    string    `json:"family_id"`
	UserID      string    `json:"user_id"`
	Role        Role      `json:"role"`
	DisplayName string    `json:"display_name"`
	JoinedAt    time.Time `json:"joined_at"`
}

type CreateFamilyRequest struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}

type Invitation struct {
	ID        string     `json:"id"`
	FamilyID  string     `json:"family_id"`
	Code      string     `json:"code"`
	Role      Role       `json:"role"`
	CreatedBy string     `json:"created_by"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	UsedBy    *string    `json:"used_by,omitempty"`
}

type GenerateInviteRequest struct {
	Role Role `json:"role" binding:"required,oneof=parent child guest"`
}

type JoinFamilyRequest struct {
	Code string `json:"code" binding:"required"`
}
