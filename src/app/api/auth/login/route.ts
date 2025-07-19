import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserService } from '@/lib/db/userService';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  console.log('Login API called');
  try {
    console.log('1. Parsing request body...');
    const body = await request.json();
    console.log('2. Validating input schema...');
    const { email, password } = loginSchema.parse(body);

    console.log('3. Finding user:', email);
    // Find user
    const user = await UserService.findByEmail(email);
    if (!user) {
      console.log('4. User not found');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('4. User found, checking password...');
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('5. Password invalid');
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('5. Password valid, generating JWT...');
    // Email confirmation check removed - auto-login after registration

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    console.log('6. JWT secret length:', jwtSecret.length);
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('7. JWT token generated successfully');

    console.log('8. Returning successful response');
    return NextResponse.json(
      { 
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

