package media

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const maxUploadSize = 20 << 20 // 20 MB

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(r *gin.RouterGroup) {
	r.POST("/:id/media", h.upload)
	r.GET("/:id/media", h.list)
	r.DELETE("/:id/media/:mediaId", h.delete)
}

func (h *Handler) upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid file"})
		return
	}
	defer file.Close()

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "image/jpeg"
	}

	if !isAllowedType(contentType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file type"})
		return
	}

	m, err := h.svc.Upload(
		c.Request.Context(),
		c.Param("id"),
		header.Filename,
		file,
		header.Size,
		contentType,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}

	c.JSON(http.StatusCreated, m)
}

func (h *Handler) list(c *gin.Context) {
	media, err := h.svc.ListByMemory(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list media"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"media": media})
}

func (h *Handler) delete(c *gin.Context) {
	if err := h.svc.Delete(c.Request.Context(), c.Param("mediaId")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed"})
		return
	}
	c.Status(http.StatusNoContent)
}

func isAllowedType(ct string) bool {
	allowed := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"image/webp":      true,
		"image/gif":       true,
		"video/mp4":       true,
		"video/quicktime": true,
		"video/webm":      true,
	}
	return allowed[ct]
}
