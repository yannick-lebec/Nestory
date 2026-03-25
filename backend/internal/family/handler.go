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
	r.GET("/:id", h.get)
	r.GET("/:id/members", h.listMembers)
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
