import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';

export async function POST(request: NextRequest) {
  try {
    console.log('=== LOGIN TEST START ===');
    
    const body = await request.json();
    const { email, password } = body;
    
    console.log('Step 1: Input received:', { email, passwordLength: password?.length });
    
    if (!email || !password) {
      return NextResponse.json({
        status: 'error',
        step: 'input_validation',
        message: 'Email and password required'
      });
    }
    
    console.log('Step 2: Finding user in database...');
    const user = await UserService.findByEmail(email);
    
    if (!user) {
      console.log('Step 3: User not found');
      return NextResponse.json({
        status: 'error',
        step: 'user_lookup',
        message: 'User not found'
      });
    }
    
    console.log('Step 3: User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    console.log('Step 4: Comparing passwords...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Step 5: Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json({
        status: 'error',
        step: 'password_verification',
        message: 'Invalid password'
      });
    }
    
    console.log('Step 6: Generating JWT token...');
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    console.log('JWT secret info:', {
      hasCustomSecret: !!process.env.JWT_SECRET,
      secretLength: jwtSecret.length
    });
    
    const tokenPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });
    
    console.log('Step 7: JWT token generated');
    
    // Verify the token immediately
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Step 8: Token verification successful:', {
      userId: decoded.userId,
      email: decoded.email
    });
    
    console.log('=== LOGIN TEST SUCCESS ===');
    
    return NextResponse.json({
      status: 'success',
      message: 'Login test completed successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        },
        tokenInfo: {
          generated: true,
          verified: true,
          payload: decoded
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('=== LOGIN TEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code
    });
    
    return NextResponse.json({
      status: 'error',
      step: 'exception',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : []
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}