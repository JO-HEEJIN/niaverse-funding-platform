import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserService } from '@/lib/db/userService';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().regex(/^[0-9]{10,11}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      phone,
      confirmed: true, // Auto-confirm user
      isAdmin: false,
    };

    await UserService.create(user);

    return NextResponse.json(
      { message: 'User registered successfully. You can now log in.' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

