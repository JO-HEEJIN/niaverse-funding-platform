# 🚀 Deploy to AWS Amplify

## Method 1: Using AWS Console (Recommended)

### Step 1: Go to AWS Amplify Console
1. Open https://console.aws.amazon.com/amplify/
2. Click "Create new app"
3. Choose "Deploy without Git provider" or "Deploy from GitHub"

### Step 2: Upload Your App
1. Create a zip file of your project:
   ```bash
   npm run build
   zip -r niaverse-app.zip . -x "node_modules/*" ".git/*" "*.log"
   ```
2. Upload the zip file to Amplify

### Step 3: Configure Environment Variables
In the Amplify console, go to "Environment variables" and add:
- `DATABASE_URL`: `postgresql://niaverse_admin:NiaverseDB2024!@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse?sslmode=require&ssl=true`
- `JWT_SECRET`: `niaverse-super-secret-jwt-key-2024-production`
- `NODE_ENV`: `production`
- `NEXT_PUBLIC_API_URL`: `https://your-amplify-domain.com`

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Test your application

## Method 2: Using GitHub (Alternative)

### Step 1: Push to GitHub
1. Create a new GitHub repository
2. Push your code:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

### Step 2: Connect to Amplify
1. Go to AWS Amplify Console
2. Click "Connect app"
3. Choose GitHub
4. Select your repository
5. Configure build settings (use the amplify.yml file)

### Step 3: Configure Environment Variables
Same as Method 1 above

### Step 4: Deploy
Amplify will automatically build and deploy

## Build Settings (amplify.yml)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## Your Database Connection Details
- **Host**: `niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `niaverse`
- **Username**: `niaverse_admin`
- **Password**: `NiaverseDB2024!`
- **Connection String**: `postgresql://niaverse_admin:NiaverseDB2024!@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse?sslmode=require&ssl=true`

## Post-Deployment Checklist
- [ ] Test user registration
- [ ] Test user login
- [ ] Test product purchases
- [ ] Test withdrawal requests
- [ ] Test admin panel
- [ ] Verify database connectivity
- [ ] Check all API endpoints