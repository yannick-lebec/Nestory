package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"nestory/api/config"
	"nestory/api/internal/auth"
	"nestory/api/internal/family"
	"nestory/api/internal/media"
	"nestory/api/internal/memory"
	"nestory/api/internal/shared/middleware"
)

func main() {
	_ = godotenv.Load(".env")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config error: %v", err)
	}

	// Database
	db, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect error: %v", err)
	}
	defer db.Close()

	if err := db.Ping(context.Background()); err != nil {
		log.Fatalf("db ping error: %v", err)
	}
	log.Println("connected to database")

	// Repositories & services
	authRepo := auth.NewRepository(db)
	authSvc := auth.NewService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authSvc)

	familyRepo := family.NewRepository(db)
	familySvc := family.NewService(familyRepo)
	familyHandler := family.NewHandler(familySvc)

	memoryRepo := memory.NewRepository(db)
	memorySvc := memory.NewService(memoryRepo)
	memoryHandler := memory.NewHandler(memorySvc)

	// Media (optional — requires S3 config)
	var mediaHandler *media.Handler
	if cfg.StorageEnabled {
		storage, err := media.NewStorage(cfg.S3Endpoint, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3Bucket, cfg.S3UseSSL)
		if err != nil {
			log.Printf("storage init failed (uploads disabled): %v", err)
		} else {
			mediaRepo := media.NewRepository(db)
			mediaSvc := media.NewService(mediaRepo, storage)
			mediaHandler = media.NewHandler(mediaSvc)
			log.Println("storage connected")
		}
	} else {
		log.Println("storage not configured — uploads disabled")
	}

	// Router
	r := gin.Default()
	r.Use(corsMiddleware())

	api := r.Group("/api/v1")

	// Public routes
	authHandler.Register(api.Group("/auth"))

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.Auth(cfg.JWTSecret))

	familyHandler.Register(protected.Group("/families"))
	memoryHandler.Register(protected.Group("/memories"))
	if mediaHandler != nil {
		mediaHandler.Register(protected.Group("/memories"))
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("server listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	log.Println("server stopped")
}

func corsMiddleware() gin.HandlerFunc {
	allowed := map[string]bool{
		"http://localhost:5173": true,
	}
	if origin := os.Getenv("FRONTEND_URL"); origin != "" {
		allowed[origin] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Family-Id")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
