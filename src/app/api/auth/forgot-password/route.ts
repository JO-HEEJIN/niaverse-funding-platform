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
    let user;
    try {
      user = await UserService.findByEmail(email);
    } catch (dbError) {
      console.error('Database error finding user:', dbError);
      // For security, don't reveal database errors to users
      // Just log the error and continue as if user doesn't exist
      return NextResponse.json(
        { message: '비밀번호 재설정 링크가 전송되었습니다.' },
        { status: 200 }
      );
    }
    
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
    const emailDomain = email.split('@')[1]?.toLowerCase();
    console.log('Attempting to send password reset email...');
    console.log('SMTP Environment check:', {
      smtpUser: process.env.SMTP_USER ? 'Set' : 'Not set',
      smtpPass: process.env.SMTP_PASS ? 'Set' : 'Not set',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      recipientEmail: email,
      emailDomain: emailDomain
    });

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendPasswordResetEmail(email, resetToken);
        console.log('Password reset email sent successfully to:', email);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        console.error('SMTP Error details:', {
          error: emailError instanceof Error ? emailError.message : emailError,
          stack: emailError instanceof Error ? emailError.stack : 'No stack trace',
          smtpUser: process.env.SMTP_USER ? 'Set' : 'Not set',
          smtpPass: process.env.SMTP_PASS ? 'Set' : 'Not set',
          recipientEmail: email,
          emailDomain: emailDomain
        });
        
        // Check if it's an AWS SES verification issue
        const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        if (errorMessage.includes('Email address is not verified') || errorMessage.includes('554 Message rejected')) {
          console.warn('AWS SES Sandbox Mode: Email address not verified. This is expected in development.');
          console.warn('To resolve this issue:');
          console.warn('1. Verify the recipient email address in AWS SES console');
          console.warn('2. Or request production access for AWS SES');
          console.warn('3. For now, password reset token is saved and can be used directly');
        }
        
        // Continue without failing - email issue shouldn't block the reset process
      }
    } else {
      console.warn('SMTP credentials not configured - password reset token saved but email not sent');
      console.warn('Missing credentials:', {
        SMTP_USER: !process.env.SMTP_USER,
        SMTP_PASS: !process.env.SMTP_PASS
      });
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
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://niaverse.org'}/reset-password?token=${resetToken}`;

  // Determine recipient email domain
  const emailDomain = email.split('@')[1]?.toLowerCase();
  
  // Configure SMTP based on recipient email domain
  const smtpConfigs = [];
  
  // For Korean email providers, use domain-specific SMTP servers
  if (emailDomain === 'naver.com') {
    // Naver SMTP configuration
    smtpConfigs.push(
      {
        name: 'Naver SMTP (for naver.com)',
        config: {
          host: 'smtp.naver.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.NAVER_USER,
            pass: process.env.NAVER_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail SMTP (fallback for Naver)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER || process.env.SMTP_USER,
            pass: process.env.GMAIL_PASS || process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'AWS SES US-East-2 (fallback)',
        config: {
          host: 'email-smtp.us-east-2.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    );
  } else if (emailDomain === 'hanmail.net' || emailDomain === 'daum.net') {
    // Daum/Hanmail SMTP configuration
    smtpConfigs.push(
      {
        name: 'Daum SMTP (for daum/hanmail)',
        config: {
          host: 'smtp.daum.net',
          port: 587,
          secure: false,
          auth: {
            user: process.env.DAUM_USER,
            pass: process.env.DAUM_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail SMTP (fallback for Daum)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER || process.env.SMTP_USER,
            pass: process.env.GMAIL_PASS || process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'AWS SES US-East-2 (fallback)',
        config: {
          host: 'email-smtp.us-east-2.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    );
  } else if (emailDomain === 'gmail.com') {
    // For Gmail, try Gmail SMTP first
    smtpConfigs.push(
      {
        name: 'Gmail SMTP (for Gmail)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER || process.env.SMTP_USER,
            pass: process.env.GMAIL_PASS || process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'AWS SES US-East-2 (fallback)',
        config: {
          host: 'email-smtp.us-east-2.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    );
  } else {
    // For other domains, use AWS SES as primary
    smtpConfigs.push(
      {
        name: 'AWS SES US-East-2',
        config: {
          host: 'email-smtp.us-east-2.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'AWS SES US-East-1',
        config: {
          host: 'email-smtp.us-east-1.amazonaws.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail SMTP (universal fallback)',
        config: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER || process.env.SMTP_USER,
            pass: process.env.GMAIL_PASS || process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    );
  }
  
  console.log(`Email domain detected: ${emailDomain}, using ${smtpConfigs.length} SMTP configurations`);

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

  const errors: Array<{ name: string; error: any }> = [];

  // Try each SMTP configuration
  for (const { name, config } of smtpConfigs) {
    try {
      console.log(`Attempting to send email via ${name}...`);
      const transporter = nodemailer.createTransport(config);
      
      // Verify connection first with timeout
      console.log(`Verifying SMTP connection for ${name}...`);
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      console.log(`SMTP connection verified for ${name}`);
      
      // Send email with timeout
      console.log(`Sending email via ${name}...`);
      const info = await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Send timeout')), 15000)
        )
      ]);
      console.log(`Email sent successfully via ${name}:`, info.messageId);
      return; // Success, exit function
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Failed to send email via ${name}:`, errorMsg);
      errors.push({ name, error: errorMsg });
      // Continue to next configuration
    }
  }
  
  // If all configurations failed
  console.error('All SMTP configurations failed:', errors);
  throw new Error(`All SMTP configurations failed: ${errors.map(e => `${e.name}: ${e.error}`).join('; ')}`);
}