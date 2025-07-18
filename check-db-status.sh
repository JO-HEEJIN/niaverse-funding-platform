#!/bin/bash

echo "🔍 Checking RDS database status..."

while true; do
    STATUS=$(aws rds describe-db-instances --db-instance-identifier niaverse-db --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null)
    ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier niaverse-db --query 'DBInstances[0].Endpoint.Address' --output text 2>/dev/null)
    
    if [ "$STATUS" = "available" ]; then
        echo "✅ Database is now available!"
        echo "🔗 Endpoint: $ENDPOINT"
        echo "📝 Update your .env.local file with:"
        echo "DATABASE_URL=postgresql://niaverse_admin:NiaverseDB2024!@$ENDPOINT:5432/niaverse"
        break
    elif [ "$STATUS" = "creating" ]; then
        echo "⏳ Database status: $STATUS (waiting...)"
        sleep 30
    else
        echo "❌ Database status: $STATUS"
        break
    fi
done