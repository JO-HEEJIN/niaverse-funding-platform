import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PurchaseService } from '@/lib/db/purchaseService';
import * as nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
        userId: string;
        email: string;
      };
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fundingType, userData } = body;

    // 임시로 기본값 설정
    const defaultPurchaseData = {
      quantity: 1,
      price: fundingType === '펀딩 I' ? 1000000 : 
             fundingType === '펀딩 II' ? 1000000 : 1000000,
      fundingTitle: fundingType === '펀딩 I' ? '도지 채굴기' : 
                   fundingType === '펀딩 II' ? '데이터 센터' : 'VAST',
    };

    // 필수 필드 검증
    if (!fundingType || !userData) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { name, birthDate, email, phone, address, contractDate, signature } = userData;

    if (!name || !birthDate || !email || !phone || !address || !contractDate || !signature) {
      return NextResponse.json(
        { message: 'Missing user data fields' },
        { status: 400 }
      );
    }

    // 계약 ID 생성
    const contractId = `CONTRACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // HTML 계약서 생성
    const contractHtml = generateContractHtml({
      contractId,
      fundingType,
      name,
      birthDate,
      email,
      phone,
      address,
      contractDate,
      signature,
    });

    // PDF 생성 또는 HTML 이메일 전송
    let pdfBuffer: Buffer | null = null;
    let emailSent = false;
    
    try {
      // PDF 생성 시도
      pdfBuffer = await generatePDF(contractHtml);
      console.log('PDF 생성 성공');
    } catch (pdfError) {
      console.error('PDF 생성 실패:', pdfError);
      // PDF 생성 실패 시 HTML 이메일로 대체
    }

    // 이메일 전송 시도
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        if (pdfBuffer && pdfBuffer.length > 0) {
          // PDF가 있으면 PDF 첨부해서 전송
          await sendEmailWithPDF(pdfBuffer, {
            fundingType,
            name,
            email,
            contractId,
          });
          console.log('PDF 첨부 이메일 전송 성공');
        } else {
          // PDF가 없으면 HTML만 전송
          await sendHTMLEmail({
            fundingType,
            name,
            email,
            contractId,
            html: contractHtml,
          });
          console.log('HTML 이메일 전송 성공');
        }
        emailSent = true;
      } else {
        console.log('SMTP 설정이 없어서 이메일 전송을 건너뜁니다.');
      }
    } catch (emailError) {
      console.error('이메일 전송 오류:', emailError);
      // 이메일 전송 실패해도 계약은 진행
    }

    // 구매 데이터 저장 (대시보드에서 보이도록)
    const purchaseData = {
      id: `PURCHASE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: decoded.userId,
      fundingId: fundingType === '펀딩 I' ? 'funding-1' : 
                fundingType === '펀딩 II' ? 'funding-2' : 'funding-3',
      quantity: defaultPurchaseData.quantity,
      price: defaultPurchaseData.price,
      timestamp: new Date(),
      contractSigned: true,
      contractData: {
        personalInfo: userData,
        signature: userData.signature,
      },
      accumulatedIncome: 0,
      lastIncomeUpdate: new Date(),
      fundingTitle: defaultPurchaseData.fundingTitle,
      fundingUnit: fundingType === '펀딩 I' ? 'Doji' : 
                   fundingType === '펀딩 II' ? 'Won' : 'VAST',
    };

    await PurchaseService.create(purchaseData);

    return NextResponse.json(
      { 
        success: true,
        contractId,
        message: '계약서가 성공적으로 제출되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contract submission error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: '계약 제출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

function generateContractHtml(data: Record<string, any>): string {
  const { contractId, fundingType, name, birthDate, email, phone, address, contractDate, signature } = data;
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>49인 이하 투자조합 계약서</title>
      <style>
        body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .contract-info { margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">49인 이하 투자조합 계약서</div>
        <div>계약 번호: ${contractId}</div>
      </div>
      <div class="contract-info">
        <strong>계약자 정보</strong><br>
        성명: ${name}<br>
        생년월일: ${birthDate}<br>
        이메일: ${email}<br>
        전화번호: ${phone}<br>
        주소: ${address}<br>
        계약일: ${contractDate}
      </div>
      <div>
        <h3>계약 내용</h3>
        <p>본 계약은 ${fundingType} 투자에 관한 계약입니다.</p>
        <p>서명: ${signature ? `<img src="${signature}" alt="전자서명" style="max-width: 200px; max-height: 100px; border: 1px solid #ccc; padding: 5px;">` : '[서명 없음]'}</p>
      </div>
    </body>
    </html>
  `;
}

async function generatePDF(html: string): Promise<Buffer> {
  let browser;
  let page;
  const startTime = Date.now();
  
  try {
    console.log('=== PDF GENERATION START ===');
    console.log('HTML content length:', html.length);
    
    // More aggressive browser cleanup options
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-networking',
        '--max_old_space_size=4096' // Increase memory limit
      ],
      timeout: 60000, // 1 minute timeout for browser launch
    });
    
    console.log('Browser launched in', Date.now() - startTime, 'ms');
    
    page = await browser.newPage();
    
    // Set page configurations
    await page.setDefaultTimeout(45000); // 45 second timeout
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Add error handlers
    page.on('error', (err) => {
      console.error('Page error:', err);
    });
    
    page.on('pageerror', (err) => {
      console.error('Page script error:', err);
    });
    
    console.log('Setting page content...');
    const contentStartTime = Date.now();
    
    // Use simpler wait condition to avoid hanging
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded', // Changed from 'networkidle0'
      timeout: 30000 
    });
    
    console.log('Content set in', Date.now() - contentStartTime, 'ms');
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(1000);
    
    console.log('Generating PDF...');
    const pdfStartTime = Date.now();
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      preferCSSPageSize: false,
      timeout: 30000 // 30 second timeout for PDF generation
    });
    
    console.log('PDF generated in', Date.now() - pdfStartTime, 'ms');
    console.log('Total generation time:', Date.now() - startTime, 'ms');
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
    
    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('=== PDF GENERATION ERROR ===');
    console.error('Total time before error:', Date.now() - startTime, 'ms');
    console.error('Error type:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    throw error;
  } finally {
    // Ensure cleanup happens in the right order
    try {
      if (page) {
        console.log('Closing page...');
        await page.close();
      }
    } catch (pageCloseError) {
      console.error('Error closing page:', pageCloseError);
    }
    
    try {
      if (browser) {
        console.log('Closing browser...');
        await browser.close();
        console.log('Browser closed successfully');
      }
    } catch (browserCloseError) {
      console.error('Error closing browser:', browserCloseError);
    }
    
    console.log('=== PDF GENERATION CLEANUP COMPLETE ===');
  }
}

async function sendEmailWithPDF(pdfBuffer: Buffer, data: Record<string, any>) {
  const { fundingType, name, email, contractId } = data;
  
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-2.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  const mailOptions = {
    from: 'master@niaverse.org',
    to: 'master@niaverse.org',
    subject: `[NIA Cloud] ${fundingType} 투자계약서 - ${name}`,
    html: `
      <h2>NIA Cloud 투자조합 계약서</h2>
      <p><strong>계약자:</strong> ${name}</p>
      <p><strong>펀딩 타입:</strong> ${fundingType}</p>
      <p><strong>계약 번호:</strong> ${contractId}</p>
      <p><strong>계약자 이메일:</strong> ${email}</p>
      <p><strong>계약 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
    `,
    attachments: [
      {
        filename: `${contractId}_${name}_투자계약서.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

async function sendHTMLEmail(data: Record<string, any>) {
  const { fundingType, name, email, contractId, html } = data;
  
  const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-2.amazonaws.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  const mailOptions = {
    from: 'master@niaverse.org',
    to: 'master@niaverse.org',
    subject: `[NIA Cloud] ${fundingType} 투자계약서 - ${name} (HTML)`,
    html: `
      <div style="padding: 20px; background-color: #f5f5f5;">
        <h2>NIA Cloud 투자조합 계약서</h2>
        <p><strong>계약자:</strong> ${name}</p>
        <p><strong>펀딩 타입:</strong> ${fundingType}</p>
        <p><strong>계약 번호:</strong> ${contractId}</p>
        <p><strong>계약자 이메일:</strong> ${email}</p>
        <p><strong>계약 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
        <p><strong>참고:</strong> PDF 생성에 실패하여 HTML 버전으로 전송됩니다.</p>
        <hr>
        ${html}
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}