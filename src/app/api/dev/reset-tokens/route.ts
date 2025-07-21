import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/userService';

// Development-only endpoint to view reset tokens
export async function GET(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: '이메일 파라미터가 필요합니다. 예: /api/dev/reset-tokens?email=user@example.com' },
        { status: 400 }
      );
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: '해당 이메일의 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Get user with reset token information
    const userWithToken = await UserService.findById(user.id);
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${(userWithToken as any).reset_token}`;

    return NextResponse.json({
      email: user.email,
      name: user.name,
      resetToken: (userWithToken as any).reset_token || null,
      resetTokenExpiry: (userWithToken as any).reset_token_expiry || null,
      resetUrl: (userWithToken as any).reset_token ? resetUrl : null,
      isTokenValid: (userWithToken as any).reset_token_expiry ? new Date((userWithToken as any).reset_token_expiry) > new Date() : false,
      message: (userWithToken as any).reset_token 
        ? '비밀번호 리셋 토큰이 있습니다. 위의 resetUrl을 사용하여 비밀번호를 재설정할 수 있습니다.'
        : '비밀번호 리셋 토큰이 없습니다. /api/auth/forgot-password를 먼저 호출하세요.'
    });

  } catch (error) {
    console.error('Error retrieving reset token:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}