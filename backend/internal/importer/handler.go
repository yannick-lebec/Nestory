package importer

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"nestory/api/internal/shared/middleware"
)

const maxImportSize = 500 << 20 // 500 MB total

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(r *gin.RouterGroup) {
	r.POST("/analyze", h.analyze)
	r.POST("/confirm", h.confirm)
}

func (h *Handler) analyze(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxImportSize)

	if err := c.Request.ParseMultipartForm(maxImportSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}

	files := c.Request.MultipartForm.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no files provided"})
		return
	}
	if len(files) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "max 500 files per import"})
		return
	}

	result, err := h.svc.Analyze(c.Request.Context(), files)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "analysis failed"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) confirm(c *gin.Context) {
	var req ConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	familyID := middleware.GetFamilyID(c)
	authorID := middleware.GetUserID(c)

	result, err := h.svc.Confirm(c.Request.Context(), familyID, authorID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "confirm failed"})
		return
	}

	c.JSON(http.StatusCreated, result)
}
