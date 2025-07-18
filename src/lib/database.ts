// Database configuration for AWS deployment
import { Pool } from 'pg';

// For development, use local connection
// For production, use RDS connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/niaverse',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;