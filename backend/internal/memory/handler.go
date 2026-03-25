package memory

import (
	"errors"
	"net/http"
	"strconv"

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
	r.POST("", h.create)
	r.GET("", h.list)
	r.GET("/:id", h.get)
	r.DELETE("/:id", h.delete)
}

func (h *Handler) create(c *gin.Context) {
	var req CreateMemoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	familyID := middleware.GetFamilyID(c)
	authorID := middleware.GetUserID(c)

	mem, err := h.svc.Create(c.Request.Context(), familyID, authorID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, mem)
}

func (h *Handler) list(c *gin.Context) {
	familyID := middleware.GetFamilyID(c)

	filter := ListMemoriesFilter{
		FamilyID: familyID,
		Search:   c.Query("q"),
		Category: Category(c.Query("category")),
		Limit:    20,
	}

	if y, err := strconv.Atoi(c.Query("year")); err == nil {
		filter.Year = y
	}
	if m, err := strconv.Atoi(c.Query("month")); err == nil {
		filter.Month = m
	}
	if p, err := strconv.Atoi(c.Query("page")); err == nil && p > 1 {
		filter.Offset = (p - 1) * filter.Limit
	}

	memories, total, err := h.svc.List(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list memories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"memories": memories,
		"total":    total,
	})
}

func (h *Handler) get(c *gin.Context) {
	mem, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if errors.Is(err, ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "memory not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get memory"})
		return
	}
	c.JSON(http.StatusOK, mem)
}

func (h *Handler) delete(c *gin.Context) {
	familyID := middleware.GetFamilyID(c)
	if err := h.svc.Delete(c.Request.Context(), c.Param("id"), familyID); err != nil {
		if errors.Is(err, ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "memory not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete memory"})
		return
	}
	c.Status(http.StatusNoContent)
}
