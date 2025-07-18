// Database configuration for AWS deployment
import { Pool } from 'pg';

// Parse connection string and handle SSL properly
const parseConnectionString = (url: string) => {
  // Remove duplicate SSL parameters if any
  return url.replace(/[?&]ssl=true/g, '');
};

// For development, use local connection
// For production, use RDS connection string
const pool = new Pool({
  connectionString: parseConnectionString(process.env.DATABASE_URL || 'postgresql://localhost:5432/niaverse'),
  ssl: process.env.DATABASE_URL && process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    // AWS RDS requires SSL
    require: true
  } : false,
});

export default pool;