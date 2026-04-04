package family

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"nestory/api/internal/shared/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(r *gin.RouterGroup) {
	r.GET("/mine", h.mine)
	r.POST("", h.create)
	r.POST("/join", h.join)
	r.GET("/:id", h.get)
	r.GET("/:id/members", h.listMembers)
	r.POST("/:id/invite", h.generateInvite)
	r.GET("/:id/invitations", h.listInvitations)
}

func (h *Handler) create(c *gin.Context) {
	var req CreateFamilyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := middleware.GetUserID(c)
	family, err := h.svc.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create family"})
		return
	}

	c.JSON(http.StatusCreated, family)
}

func (h *Handler) get(c *gin.Context) {
	family, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "family not found"})
		return
	}
	c.JSON(http.StatusOK, family)
}

func (h *Handler) mine(c *gin.Context) {
	userID := middleware.GetUserID(c)
	families, err := h.svc.GetUserFamilies(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get families"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"families": families})
}

func (h *Handler) listMembers(c *gin.Context) {
	members, err := h.svc.ListMembers(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list members"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"members": members})
}

func (h *Handler) generateInvite(c *gin.Context) {
	var req GenerateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	inv, err := h.svc.GenerateInvite(c.Request.Context(), c.Param("id"), userID, req)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, inv)
}

func (h *Handler) join(c *gin.Context) {
	var req JoinFamilyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := middleware.GetUserID(c)
	family, err := h.svc.JoinByCode(c.Request.Context(), userID, req.Code)
	if err != nil {
		if err == ErrAlreadyMember {
			c.JSON(http.StatusConflict, gin.H{"error": "already a member of this family"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired invitation code"})
		return
	}
	c.JSON(http.StatusOK, family)
}

func (h *Handler) listInvitations(c *gin.Context) {
	userID := middleware.GetUserID(c)
	invs, err := h.svc.ListInvitations(c.Request.Context(), c.Param("id"), userID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invitations": invs})
}
