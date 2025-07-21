import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get('email') || 'test@gmail.com';
    const emailDomain = testEmail.split('@')[1]?.toLowerCase();

    console.log('Testing SMTP configurations...');
    console.log('Environment variables:');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set');
    console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? 'Set' : 'Not set');
    console.log('NAVER_USER:', process.env.NAVER_USER ? 'Set' : 'Not set');
    console.log('NAVER_PASS:', process.env.NAVER_PASS ? 'Set' : 'Not set');
    console.log('DAUM_USER:', process.env.DAUM_USER ? 'Set' : 'Not set');
    console.log('DAUM_PASS:', process.env.DAUM_PASS ? 'Set' : 'Not set');

    // Configure SMTP based on email domain (same logic as forgot-password)
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
    } else if (emailDomain === 'hanmail.net' || emailDomain === 'daum.net') {
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
            tls: { rejectUnauthorized: false }
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
            tls: { rejectUnauthorized: false }
          }
        }
      );
    }

    const results = [];
    
    for (const { name, config } of smtpConfigs) {
      try {
        console.log(`Testing ${name}...`);
        
        if (!config.auth.user || !config.auth.pass) {
          results.push({
            name,
            success: false,
            error: 'Credentials not configured',
            config: { host: config.host, port: config.port }
          });
          continue;
        }

        const transporter = nodemailer.createTransport(config);
        
        // Test connection with timeout
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 10000)
          )
        ]);
        
        results.push({
          name,
          success: true,
          message: 'Connection successful',
          config: { host: config.host, port: config.port }
        });
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`${name} failed:`, errorMsg);
        results.push({
          name,
          success: false,
          error: errorMsg,
          config: { host: config.host, port: config.port }
        });
      }
    }
    
    return NextResponse.json({
      testEmail,
      emailDomain,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('SMTP test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
}