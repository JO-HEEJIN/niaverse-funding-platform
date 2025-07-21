import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/userService';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: '토큰이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // Check if token exists and is not expired
    const user = await UserService.findByResetToken(token);
    
    if (!user) {
      return NextResponse.json(
        { valid: false, message: '토큰이 만료되었거나 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, message: '유효한 토큰입니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}