// Database configuration for AWS deployment
import { Pool } from 'pg';

// Clean the connection string to remove SSL parameters
const cleanConnectionString = (url: string) => {
  return url.replace('?sslmode=require&ssl=true', '');
};

// For development, use local connection
// For production, use RDS connection string
const pool = new Pool({
  connectionString: cleanConnectionString(process.env.DATABASE_URL || 'postgresql://localhost:5432/niaverse'),
  ssl: process.env.DATABASE_URL && process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;