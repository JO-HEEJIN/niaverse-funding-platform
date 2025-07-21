import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/db/userService';
import * as nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: '비밀번호 재설정 링크가 전송되었습니다.' },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Save reset token to user
    try {
      await UserService.savePasswordResetToken(user.id, resetToken, resetTokenExpiry);
    } catch (dbError) {
      console.error('Database error saving reset token:', dbError);
      return NextResponse.json(
        { message: '데이터베이스 오류가 발생했습니다. 관리자에게 문의하세요.' },
        { status: 500 }
      );
    }

    // Send email with reset link
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return NextResponse.json(
          { message: '이메일 전송에 실패했습니다. 다시 시도해주세요.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { message: '비밀번호 재설정 링크가 전송되었습니다.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function sendPasswordResetEmail(email: string, resetToken: string) {
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-2.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: 'master@niaverse.org',
    to: email,
    subject: '[NIA Cloud] 비밀번호 재설정 요청',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 10px;">🔐 NIA Cloud</h1>
          <h2 style="color: #374151; font-size: 20px; margin: 0;">비밀번호 재설정</h2>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #374151; margin: 0 0 15px 0; line-height: 1.5;">
            안녕하세요,
          </p>
          
          <p style="color: #374151; margin: 0 0 15px 0; line-height: 1.5;">
            NIA Cloud 계정의 비밀번호 재설정을 요청하셨습니다.
            아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              비밀번호 재설정하기
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0; line-height: 1.5;">
            위 버튼이 작동하지 않는다면, 아래 링크를 복사하여 브라우저에 붙여넣으세요:
            <br>
            <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
            <strong>⚠️ 중요:</strong> 이 링크는 1시간 후에 만료됩니다.
            비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
          </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>NIA Cloud 보안팀</p>
          <p>이 이메일은 자동으로 생성되었습니다. 회신하지 마세요.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}