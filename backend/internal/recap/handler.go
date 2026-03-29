package recap

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(r *gin.RouterGroup) {
	r.GET("", h.get)
	r.GET("/months", h.months)
}

func (h *Handler) months(c *gin.Context) {
	familyID := c.GetHeader("X-Family-Id")
	if familyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "X-Family-Id header required"})
		return
	}
	months, err := h.svc.AvailableMonths(c.Request.Context(), familyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if months == nil {
		months = []AvailableMonth{}
	}
	c.JSON(http.StatusOK, months)
}

func (h *Handler) get(c *gin.Context) {
	familyID := c.GetHeader("X-Family-Id")
	if familyID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "X-Family-Id header required"})
		return
	}

	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	if y := c.Query("year"); y != "" {
		if v, err := strconv.Atoi(y); err == nil {
			year = v
		}
	}
	if m := c.Query("month"); m != "" {
		if v, err := strconv.Atoi(m); err == nil && v >= 1 && v <= 12 {
			month = v
		}
	}

	recap, err := h.svc.Generate(c.Request.Context(), familyID, year, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recap)
}
