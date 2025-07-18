# Niaverse AWS Deployment Guide

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com/
2. **AWS CLI** - Already installed ✅
3. **Amplify CLI** - Already installed ✅
4. **AWS Credentials** - Configure with `aws configure`

## Step 1: Configure AWS Credentials

Run the following command and enter your AWS credentials:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (recommended: us-east-1)
- Default output format (json)

## Step 2: Set Up Database (Amazon RDS)

### Option A: Using AWS Console (Recommended for beginners)

1. Go to AWS RDS Console
2. Click "Create database"
3. Choose "PostgreSQL"
4. Select "Free tier" for development
5. Set:
   - DB instance identifier: `niaverse-db`
   - Master username: `admin`
   - Master password: `[your-secure-password]`
   - DB name: `niaverse`
6. Make sure "Publicly accessible" is "Yes" for initial setup
7. Note the endpoint URL after creation

### Option B: Using AWS CLI

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier niaverse-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --db-name niaverse \
  --publicly-accessible
```

## Step 3: Set Up Database Schema

Once your RDS instance is ready:

1. Get the endpoint URL from AWS Console
2. Update your `.env.local` with the RDS connection string:
   ```
   DATABASE_URL=postgresql://admin:YourPassword@your-rds-endpoint:5432/niaverse
   ```
3. Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:push
   ```

## Step 4: Migrate Existing Data

Run the migration script to transfer your current JSON data:

```bash
npx tsx src/scripts/migrate-data.ts
```

## Step 5: Deploy to AWS Amplify

### Initialize Amplify Project

```bash
amplify init
```

Choose these options:
- Project name: `niaverse`
- Environment name: `production`
- Default editor: `Visual Studio Code`
- Type of app: `javascript`
- Framework: `react`
- Source directory: `src`
- Build directory: `build`
- Build command: `npm run build`
- Start command: `npm start`

### Add Hosting

```bash
amplify add hosting
```

Choose:
- Select hosting plugin: `Hosting with Amplify Console`
- Type: `Manual deployment`

### Configure Environment Variables

In AWS Amplify Console:
1. Go to your app settings
2. Navigate to "Environment variables"
3. Add:
   - `DATABASE_URL`: Your RDS connection string
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_API_URL`: Your Amplify app URL

### Deploy

```bash
amplify publish
```

## Step 6: Set Up Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Add your custom domain
3. Follow the verification process

## Step 7: Set Up SSL Certificate

AWS Amplify automatically provides SSL certificates for your domain.

## Step 8: Monitor and Maintain

1. **CloudWatch Logs**: Monitor application logs
2. **RDS Monitoring**: Monitor database performance
3. **Amplify Console**: Monitor deployments and traffic

## Security Checklist

- [ ] Database security group restricts access
- [ ] Strong passwords for RDS
- [ ] JWT_SECRET is secure and unique
- [ ] Environment variables are properly set
- [ ] SSL certificate is active
- [ ] Regular database backups are enabled

## Cost Optimization

### Free Tier Limits:
- **RDS**: 750 hours of db.t3.micro
- **Amplify**: 1,000 build minutes, 15 GB served per month
- **S3**: 5 GB storage, 20,000 GET requests

### Estimated Monthly Costs (Beyond Free Tier):
- **RDS t3.micro**: ~$15-20
- **Amplify Hosting**: ~$15-25
- **S3 Storage**: ~$1-5
- **Total**: ~$30-50/month

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check RDS security group allows connections
   - Verify DATABASE_URL format
   - Ensure RDS instance is running

2. **Build Failures**
   - Check environment variables in Amplify
   - Verify all dependencies are in package.json
   - Check build logs in Amplify Console

3. **Permission Errors**
   - Verify AWS credentials have necessary permissions
   - Check IAM policies for RDS and Amplify access

## Next Steps

1. Set up monitoring and alerts
2. Configure automated backups
3. Set up staging environment
4. Implement CI/CD pipeline
5. Add logging and error tracking (Sentry)
6. Optimize performance with CDN
7. Set up automated testing

## Support

If you encounter issues:
1. Check AWS documentation
2. Review CloudWatch logs
3. Contact AWS support (if needed)
4. Check Amplify Console for deployment logs