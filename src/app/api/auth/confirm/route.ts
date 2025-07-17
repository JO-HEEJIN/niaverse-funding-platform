import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fileStorage } from '@/lib/fileStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      userId: string;
    };

    // Find user and confirm
    const confirmed = fileStorage.confirmUser(decoded.userId);
    if (!confirmed) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Email confirmed successfully! You can now log in.' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid or expired confirmation token' },
      { status: 400 }
    );
  }
}

