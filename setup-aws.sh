#!/bin/bash

# Niaverse AWS Setup Script
echo "🚀 Setting up Niaverse for AWS deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
echo -e "${YELLOW}📋 Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Please run 'aws configure' first.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ AWS CLI is configured${NC}"
fi

# Check if database URL is set
echo -e "${YELLOW}📋 Checking database configuration...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Please set it in .env.local${NC}"
    echo "Example: DATABASE_URL=postgresql://admin:password@your-rds-endpoint:5432/niaverse"
    exit 1
else
    echo -e "${GREEN}✅ Database URL is configured${NC}"
fi

# Generate database migrations
echo -e "${YELLOW}📊 Generating database migrations...${NC}"
npm run db:generate

# Push schema to database
echo -e "${YELLOW}📊 Pushing schema to database...${NC}"
npm run db:push

# Run data migration
echo -e "${YELLOW}📊 Migrating existing data...${NC}"
if npx tsx src/scripts/migrate-data.ts; then
    echo -e "${GREEN}✅ Data migration completed${NC}"
else
    echo -e "${RED}❌ Data migration failed${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}📦 Building application...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Check if Amplify is initialized
if [ ! -f "amplify.yml" ]; then
    echo -e "${YELLOW}☁️  Initializing Amplify...${NC}"
    echo "Please follow the prompts to initialize Amplify"
    amplify init
fi

# Deploy to Amplify
echo -e "${YELLOW}☁️  Deploying to AWS Amplify...${NC}"
if amplify publish; then
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Your application is now live!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up custom domain (optional)"
echo "2. Configure monitoring and alerts"
echo "3. Set up automated backups"
echo "4. Review security settings"