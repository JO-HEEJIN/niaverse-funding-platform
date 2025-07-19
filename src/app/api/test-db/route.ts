import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let client;
  try {
    console.log('Testing database connection...');
    client = await pool.connect();
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Database connection successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      code: (error as any)?.code,
      detail: (error as any)?.detail
    });
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}