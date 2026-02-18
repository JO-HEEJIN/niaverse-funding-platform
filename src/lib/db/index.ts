import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/niaverse';

// For development
const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type DB = typeof db;
export * from './schema';