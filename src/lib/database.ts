// Database configuration for AWS deployment
import { Pool } from 'pg';
import { getDatabaseUrl } from './db-config';

// Parse connection string and handle SSL properly
const parseConnectionString = (url: string) => {
  // Remove duplicate SSL parameters if any
  return url.replace(/[?&]ssl=true/g, '');
};

// Get database URL from config
const databaseUrl = getDatabaseUrl();

// Debug logging
console.log('Database URL:', databaseUrl ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

const pool = new Pool({
  connectionString: parseConnectionString(databaseUrl),
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    // AWS RDS requires SSL
    require: true
  } : false,
});

export default pool;