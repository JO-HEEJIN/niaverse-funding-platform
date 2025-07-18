#!/bin/bash

# AWS Deployment Script for Niaverse Platform

echo "🚀 Starting AWS deployment for Niaverse..."

# Step 1: Build the application
echo "📦 Building application..."
npm run build

# Step 2: Create S3 bucket for static assets
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://niaverse-static-assets --region us-east-1

# Step 3: Upload static assets to S3
echo "⬆️ Uploading static assets..."
aws s3 sync .next/static s3://niaverse-static-assets/static --delete

# Step 4: Create RDS database
echo "🗄️ Creating RDS database..."
aws rds create-db-instance \
  --db-instance-identifier niaverse-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password yourpassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx

# Step 5: Deploy to AWS Amplify
echo "☁️ Deploying to AWS Amplify..."
amplify publish

echo "✅ Deployment complete!"
echo "🌐 Your application will be available at: https://your-amplify-domain.com"