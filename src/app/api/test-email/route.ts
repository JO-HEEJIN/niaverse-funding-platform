import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { message: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Determine recipient email domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    console.log(`Testing email sending to ${email} (domain: ${emailDomain})`);
    console.log('Environment variables:');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set');
    console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set' : 'Not set');
    console.log('NAVER_USER:', process.env.NAVER_USER ? 'Set' : 'Not set');
    console.log('NAVER_PASS:', process.env.NAVER_PASS ? 'Set' : 'Not set');

    // Configure SMTP based on email domain
    const smtpConfigs = [];
    
    if (emailDomain === 'naver.com') {
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
            tls: { rejectUnauthorized: false }
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
            tls: { rejectUnauthorized: false }
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
            tls: { rejectUnauthorized: false }
          }
        }
      );
    } else if (emailDomain === 'gmail.com') {
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
            tls: { rejectUnauthorized: false }
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
            tls: { rejectUnauthorized: false }
          }
        }
      );
    } else {
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
            tls: { rejectUnauthorized: false }
          }
        }
      );
    }

    const mailOptions = {
      from: 'master@niaverse.org',
      to: email,
      subject: '[NIA Cloud] 테스트 이메일',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937;">🧪 NIA Cloud 이메일 테스트</h1>
          <p>이 이메일은 NIA Cloud 이메일 전송 기능 테스트를 위해 발송되었습니다.</p>
          <p><strong>발송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          <p><strong>수신 이메일:</strong> ${email}</p>
          <p><strong>이메일 도메인:</strong> ${emailDomain}</p>
          <p>이 이메일이 정상적으로 수신되었다면 SMTP 설정이 올바르게 작동하고 있습니다.</p>
        </div>
      `,
    };

    const errors: Array<{ name: string; error: any }> = [];

    // Try each SMTP configuration
    for (const { name, config } of smtpConfigs) {
      try {
        console.log(`Attempting to send email via ${name}...`);
        
        if (!config.auth.user || !config.auth.pass) {
          console.log(`${name}: Credentials not configured`);
          errors.push({ name, error: 'Credentials not configured' });
          continue;
        }

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
        
        return NextResponse.json({
          success: true,
          message: '테스트 이메일이 성공적으로 전송되었습니다.',
          details: {
            smtp: name,
            messageId: info.messageId,
            email: email,
            emailDomain: emailDomain
          }
        });
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send email via ${name}:`, errorMsg);
        errors.push({ name, error: errorMsg });
      }
    }
    
    // If all configurations failed
    console.error('All SMTP configurations failed:', errors);
    return NextResponse.json({
      success: false,
      message: '모든 SMTP 설정에서 이메일 전송에 실패했습니다.',
      errors: errors
    }, { status: 500 });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}