package media

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Storage struct {
	client    *s3.Client
	bucket    string
	publicURL string // base URL for public file access
}

// NewStorage creates an S3-compatible storage client.
// endpoint is the full S3 API URL, e.g.:
//   - Supabase: https://<ref>.supabase.co/storage/v1/s3
//   - MinIO:    http://localhost:9000
func NewStorage(endpoint, accessKey, secretKey, bucket string) (*Storage, error) {
	// Derive public URL base for Supabase Storage
	// Supabase S3 endpoint: https://<ref>.supabase.co/storage/v1/s3
	// Public URL base:      https://<ref>.supabase.co/storage/v1/object/public/<bucket>
	publicBase := endpoint
	if strings.Contains(endpoint, "supabase.co") {
		base := strings.Replace(endpoint, "/storage/v1/s3", "", 1)
		publicBase = fmt.Sprintf("%s/storage/v1/object/public/%s", base, bucket)
	} else {
		// MinIO / generic S3
		publicBase = fmt.Sprintf("%s/%s", strings.TrimRight(endpoint, "/"), bucket)
	}

	cfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
		),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, err
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return &Storage{client: client, bucket: bucket, publicURL: publicBase}, nil
}

func (s *Storage) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          r,
		ContentLength: aws.Int64(size),
		ContentType:   aws.String(contentType),
	})
	return err
}

func (s *Storage) Copy(ctx context.Context, srcKey, dstKey string) error {
	copySource := fmt.Sprintf("%s/%s", s.bucket, srcKey)
	_, err := s.client.CopyObject(ctx, &s3.CopyObjectInput{
		Bucket:     aws.String(s.bucket),
		CopySource: aws.String(copySource),
		Key:        aws.String(dstKey),
	})
	return err
}

func (s *Storage) Delete(ctx context.Context, key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

func (s *Storage) PublicURL(key string) string {
	return fmt.Sprintf("%s/%s", s.publicURL, key)
}

func (s *Storage) BaseURL() string {
	return s.publicURL
}
