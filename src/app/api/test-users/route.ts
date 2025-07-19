import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  let client;
  try {
    console.log('Testing users table...');
    client = await pool.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        status: 'error',
        message: 'Users table does not exist',
        suggestion: 'Need to create users table'
      });
    }
    
    // Get table structure
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    // Count users
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    
    // Get sample users (without passwords)
    const sampleUsers = await client.query(`
      SELECT id, email, name, confirmed, is_admin, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    return NextResponse.json({
      status: 'success',
      message: 'Users table analysis complete',
      data: {
        tableExists: true,
        structure: structure.rows,
        userCount: parseInt(userCount.rows[0].count),
        sampleUsers: sampleUsers.rows
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Users table test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Users table test failed',
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