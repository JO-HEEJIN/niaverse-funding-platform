import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create connection
const connectionString = process.env.DATABASE_URL || 'postgresql://niaverse_admin:Qlalfqjsgh1%21@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse';

// For development
const client = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export types
export type DB = typeof db;
export * from './schema';