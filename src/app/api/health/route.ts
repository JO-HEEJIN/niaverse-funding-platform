import { NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET() {
  const status = {
    api: 'ok',
    database: 'unknown',
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
  };

  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    status.database = 'connected';
  } catch (error) {
    status.database = 'error';
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        ...status, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }

  return NextResponse.json(status);
}