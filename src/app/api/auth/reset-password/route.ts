import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/userService';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: '토큰과 비밀번호를 모두 제공해주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: '비밀번호는 최소 6자리 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // Verify token and get user
    const user = await UserService.findByResetToken(token);
    
    if (!user) {
      return NextResponse.json(
        { message: '토큰이 만료되었거나 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    const success = await UserService.updatePassword(user.id, hashedPassword);

    if (!success) {
      return NextResponse.json(
        { message: '비밀번호 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '비밀번호가 성공적으로 변경되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}