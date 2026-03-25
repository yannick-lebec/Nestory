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

type InviteMemberRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Role        Role   `json:"role" binding:"required,oneof=parent child guest"`
	DisplayName string `json:"display_name" binding:"required,min=2"`
}
