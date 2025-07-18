# Terraform configuration for AWS infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# RDS PostgreSQL Database
resource "aws_db_instance" "niaverse_db" {
  identifier     = "niaverse-db"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type         = "gp2"
  storage_encrypted    = true
  
  db_name  = "niaverse"
  username = "admin"
  password = "changeme123!" # Use AWS Secrets Manager in production
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name        = "niaverse-db"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "niaverse-rds-sg"
  description = "Security group for RDS database"
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this in production
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "niaverse-rds-sg"
  }
}

# S3 Bucket for static assets
resource "aws_s3_bucket" "static_assets" {
  bucket = "niaverse-static-assets-${random_string.bucket_suffix.result}"
  
  tags = {
    Name        = "niaverse-static-assets"
    Environment = var.environment
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for user uploads
resource "aws_s3_bucket" "user_uploads" {
  bucket = "niaverse-uploads-${random_string.bucket_suffix.result}"
  
  tags = {
    Name        = "niaverse-uploads"
    Environment = var.environment
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "static_assets" {
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static_assets.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.static_assets.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name        = "niaverse-cdn"
    Environment = var.environment
  }
}

resource "aws_cloudfront_origin_access_identity" "static_assets" {
  comment = "OAI for Niaverse static assets"
}

# Outputs
output "rds_endpoint" {
  value = aws_db_instance.niaverse_db.endpoint
}

output "s3_static_bucket" {
  value = aws_s3_bucket.static_assets.bucket
}

output "s3_uploads_bucket" {
  value = aws_s3_bucket.user_uploads.bucket
}

output "cloudfront_domain" {
  value = aws_cloudfront_distribution.static_assets.domain_name
}