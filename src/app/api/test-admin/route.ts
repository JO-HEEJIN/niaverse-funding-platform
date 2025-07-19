import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/userService';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing admin account...');
    
    // Check if admin user exists
    const adminUser = await UserService.findByEmail('master@niaverse.org');
    
    if (!adminUser) {
      return NextResponse.json({
        status: 'missing',
        message: 'Admin user does not exist',
        suggestion: 'Need to create admin user'
      });
    }
    
    // Test password
    const isValidPassword = await bcrypt.compare('Qlalfqjsgh1!', adminUser.password);
    
    return NextResponse.json({
      status: 'success',
      message: 'Admin account found',
      data: {
        email: adminUser.email,
        name: adminUser.name,
        isAdmin: adminUser.isAdmin,
        confirmed: adminUser.confirmed,
        passwordValid: isValidPassword
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Admin test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating admin account...');
    
    // Check if admin already exists
    const existingAdmin = await UserService.findByEmail('master@niaverse.org');
    if (existingAdmin) {
      return NextResponse.json({
        status: 'exists',
        message: 'Admin user already exists'
      });
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('Qlalfqjsgh1!', 10);
    const adminUser = {
      id: `USER_${Date.now()}_ADMIN`,
      email: 'master@niaverse.org',
      password: hashedPassword,
      name: 'Administrator',
      phone: '',
      confirmed: true,
      isAdmin: true
    };
    
    await UserService.create(adminUser);
    
    return NextResponse.json({
      status: 'created',
      message: 'Admin user created successfully',
      data: {
        email: adminUser.email,
        name: adminUser.name
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Admin creation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}