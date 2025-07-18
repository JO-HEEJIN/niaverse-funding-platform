import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com',
    port: 5432,
    user: 'niaverse_admin',
    password: 'NiaverseDB2024!',
    database: 'niaverse',
    ssl: { rejectUnauthorized: false },
  },
} satisfies Config;