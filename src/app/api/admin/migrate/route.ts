import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Check if user is admin
    const user = await UserService.findById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();
    
    try {
      // Run migration SQL
      await client.query(`
        -- Add approved column to purchases table
        ALTER TABLE purchases 
        ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255);
      `);

      // Update existing purchases with contractSigned = true to be approved
      const result = await client.query(`
        UPDATE purchases 
        SET approved = true, approved_at = CURRENT_TIMESTAMP 
        WHERE contract_signed = true AND approved IS NULL;
      `);

      return NextResponse.json({ 
        message: 'Migration completed successfully',
        updatedRows: result.rowCount 
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        message: 'Migration failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}