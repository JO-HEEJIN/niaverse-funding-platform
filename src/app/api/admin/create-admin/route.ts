import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserService } from '@/lib/db/userService';

export async function POST(request: NextRequest) {
  try {
    const { secretKey } = await request.json();
    
    // Security check - only allow with secret key
    if (secretKey !== 'niaverse-admin-setup-2024') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const adminEmail = 'master@niaverse.org';
    const adminPassword = 'Qlalfqjsgh1!';

    // Check if admin already exists
    const existingAdmin = await UserService.findByEmail(adminEmail);
    if (existingAdmin) {
      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // We need to update the user, but UserService doesn't have update method
      // Let's create it or use direct database query
      const pool = (await import('@/lib/database')).default;
      const client = await pool.connect();
      
      try {
        await client.query(
          'UPDATE users SET password_hash = $1, is_admin = true WHERE email = $2',
          [hashedPassword, adminEmail]
        );
      } finally {
        client.release();
      }

      return NextResponse.json({ 
        message: 'Admin account updated successfully',
        email: adminEmail 
      });
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      const admin = {
        id: `admin_${Date.now()}`,
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        phone: '010-0000-0000',
        confirmed: true,
        isAdmin: true,
      };

      await UserService.create(admin);

      return NextResponse.json({ 
        message: 'Admin account created successfully',
        email: adminEmail 
      });
    }
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to create admin account', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}