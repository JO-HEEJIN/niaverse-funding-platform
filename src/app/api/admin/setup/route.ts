import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { fileStorage } from '@/lib/fileStorage';

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const users = fileStorage.getAllUsers();
    const adminExists = users.some(user => user.isAdmin);
    
    if (adminExists) {
      return NextResponse.json(
        { message: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = {
      id: Date.now().toString(),
      email: 'admin@niaverse.com',
      password: hashedPassword,
      name: 'Administrator',
      phone: '01012345678',
      confirmed: true,
      isAdmin: true
    };

    fileStorage.addUser(adminUser);

    return NextResponse.json({
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@niaverse.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { message: 'Failed to create admin user' },
      { status: 500 }
    );
  }
}