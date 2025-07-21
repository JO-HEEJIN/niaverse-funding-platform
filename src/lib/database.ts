// Database configuration for AWS deployment
import { Pool } from 'pg';
import { getDatabaseUrl } from './db-config';

// Parse connection string and handle SSL properly
const parseConnectionString = (url: string) => {
  // URL encode the password if it contains special characters
  try {
    const urlObj = new URL(url);
    // The password might contain special characters that need encoding
    if (urlObj.password && urlObj.password.includes('!')) {
      console.log('Detected special characters in password, encoding...');
      // Password is already part of the URL, no need to re-encode
    }
    return url;
  } catch (e) {
    console.error('Error parsing database URL:', e);
    return url;
  }
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

// Create pool configuration
const poolConfig: any = {
  connectionString: parseConnectionString(databaseUrl),
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when requesting a connection
};

// Add SSL configuration for AWS RDS
if (databaseUrl && databaseUrl.includes('amazonaws.com')) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

// Add error handler for connection issues
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;