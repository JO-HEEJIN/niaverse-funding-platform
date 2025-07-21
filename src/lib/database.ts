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
console.log('DATABASE_URL env var:', process.env.DATABASE_URL ? 'Set' : 'Not set');
if (databaseUrl) {
  // Log without credentials
  const urlParts = databaseUrl.split('@');
  if (urlParts.length > 1) {
    console.log('Database host:', urlParts[1]);
  }
}

const pool = new Pool({
  connectionString: parseConnectionString(databaseUrl),
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when requesting a connection
  ssl: databaseUrl && databaseUrl.includes('amazonaws.com') ? { 
    rejectUnauthorized: false,
    // Additional SSL options for development
    checkServerIdentity: () => undefined
  } : false,
});

// Add error handler for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;