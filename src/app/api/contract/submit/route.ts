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
      price: fundingType === '펀딩 I' ? 10000000 : 
             fundingType === '펀딩 II' ? 20000000 : 50000000,
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

    // PDF 생성 (Puppeteer가 설치되지 않은 경우 건너뛰기)
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generatePDF(contractHtml);
    } catch (pdfError) {
      console.error('PDF 생성 실패:', pdfError);
      // PDF 생성 실패해도 계약은 진행
    }

    // 이메일 전송 (에러 발생 시에도 계약은 저장되도록 try-catch 처리)
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && pdfBuffer) {
        await sendEmailWithPDF(pdfBuffer, {
          fundingType,
          name,
          email,
          contractId,
        });
      } else {
        console.log('SMTP 설정이 없거나 PDF 생성 실패로 이메일 전송을 건너뜁니다.');
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
        <p>서명: <img src="${signature}" alt="전자서명" style="max-width: 200px; max-height: 100px;"></p>
      </div>
    </body>
    </html>
  `;
}

async function generatePDF(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    if (browser) await browser.close();
    return Buffer.from('');
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