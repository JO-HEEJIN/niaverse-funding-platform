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

    // 펀딩별 계좌 정보 반환
    const getAccountInfo = (fundingType: string) => {
      switch(fundingType) {
        case '펀딩 I':
          return { status: 'closed', message: '마감되었습니다' };
        case '펀딩 II':
          return { 
            status: 'active', 
            bank: '국민은행', 
            accountHolder: '윤정훈',
            accountNumber: '703002-01-135781'
          };
        case '펀딩 III':
          return { 
            status: 'active', 
            bank: '미래에셋증권', 
            accountHolder: '임희윤',
            accountNumber: '808-0038-8314-0'
          };
        default:
          return { status: 'unknown' };
      }
    };

    return NextResponse.json(
      { 
        success: true,
        contractId,
        fundingType,
        accountInfo: getAccountInfo(fundingType),
        message: '계약서가 성공적으로 제출되었습니다.',
        pdfGenerated: !!pdfBuffer,
        emailSent: emailSent
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
  
  // 생년월일 포맷팅 (19900101 -> 1990.01.01)
  const formatBirthDate = (dateStr: string) => {
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  };
  
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>49인 이하 투자조합 계약서</title>
      <style>
        @page { 
          size: A4; 
          margin: 20mm; 
        }
        body { 
          font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          font-size: 12px;
          margin: 0;
          padding: 20px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #000; 
          padding-bottom: 20px; 
        }
        .title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .contract-info { 
          margin-bottom: 30px; 
          padding: 20px; 
          background-color: #f8f9fa; 
          border: 1px solid #ddd;
          border-radius: 8px; 
        }
        .content-section {
          margin: 20px 0;
        }
        .article {
          margin: 15px 0;
        }
        .article-title {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .signature-section {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-img {
          max-width: 150px;
          max-height: 80px;
          border: 1px solid #ccc;
          padding: 5px;
          margin: 10px 0;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          width: 150px;
          height: 40px;
          margin: 10px auto;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">49인 이하 투자조합 계약서</div>
        <div>계약 번호: ${contractId}</div>
        <div>NIA CLOUD</div>
      </div>
      
      <div class="contract-info">
        <h4><strong>계약자 정보</strong></h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 120px;"><strong>성명</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${name}</td>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 120px;"><strong>생년월일</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${formatBirthDate(birthDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>이메일</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>전화번호</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>주소</strong></td>
            <td colspan="3" style="padding: 8px; border: 1px solid #ddd;">${address}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>투자상품</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${fundingType}</td>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>계약일</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${contractDate}</td>
          </tr>
        </table>
      </div>

      <div class="content-section">
        <p><strong>본 계약은 투자자(이하 "조합원")와 윤정훈(이하 "업무집행자")이 상호 신뢰와 협력을 바탕으로 「벤처투자 촉진에 관한 법률」 제19조 및 관련 법령에 의거하여 49인 이하의 사적 투자조합(이하 "조합")을 설립하고, 공동 출자에 따른 투자활동 및 권리·의무의 사항을 규정함을 목적으로 다음과 같이 체결한다.</strong></p>
        
        <div class="article">
          <div class="article-title">제1조 (조합의 명칭 및 목적)</div>
          <p>① 본 조합은 "NIA Cloud 49인 투자조합"(이하 "조합")이라 칭한다.</p>
          <p>② 조합은 조합원이 공동으로 출자한 자금을 바탕으로 벤처기업, 실물자산 등 성장 잠재력이 있는 사업에 투자하여 그 성과에 따른 이익을 조합원에게 배분함을 목적으로 한다.</p>
        </div>

        <div class="article">
          <div class="article-title">제2조 (조합원의 자격 및 출자)</div>
          <p>① 조합원은 49인을 초과하지 아니한다.</p>
          <p>② 조합원은 본 계약에 명시된 출자금액을 업무집행자가 지정하는 계좌에 납입하며, 출자금액과 지분율은 별도의 서면 합의서에 따른다.</p>
          <p>③ 출자금의 납입은 완전하고 무조건적이며, 출자금 미납 시 조합원 자격을 상실할 수 있다.</p>
        </div>

        <div class="article">
          <div class="article-title">제3조 (업무집행자 및 대표)</div>
          <p>① 업무집행자는 윤정훈으로 한다.</p>
          <p>② 업무집행자는 조합의 업무를 선량한 관리자 의무의 범위 내에서 성실히 수행하며, 조합의 자산 운용, 투자, 회계관리 및 조합원에 대한 보고 업무를 담당한다.</p>
          <p>③ 업무집행자는 고의 또는 중대한 과실이 없는 한 조합의 투자 결과로 인한 손실에 대해 법적 책임을 지지 아니한다.</p>
        </div>

        <div class="article">
          <div class="article-title">제4조 (이익 및 손실의 배분)</div>
          <p>① 조합의 모든 이익과 손실은 조합원의 출자비율에 따라 배분 및 분담한다.</p>
          <p>② 조합원은 조합의 결산 결과에 따라 정기적으로 수익을 배분받으며, 손실에 대해서도 출자비율에 따라 부담한다.</p>
        </div>

        <div class="article">
          <div class="article-title">제5조 (지분의 양도 및 제한)</div>
          <p>① 조합원의 지분 양도는 업무집행자의 사전 서면 동의를 받아야 한다.</p>
          <p>② 업무집행자는 조합의 안정적 운영과 조합원의 권익 보호를 위해 부당한 지분 양도를 제한할 수 있다.</p>
        </div>

        <div class="article">
          <div class="article-title">제6조 (조합의 존속기간 및 해산)</div>
          <p>① 조합의 존속기간은 본 계약 체결일로부터 2년으로 한다.</p>
          <p>② 존속기간 만료, 조합원 전원의 동의, 업무집행자의 제안에 따른 조합원 총회의 의결 또는 법률에서 정하는 사유 발생 시 조합은 해산한다.</p>
          <p>③ 해산 시 조합의 청산 절차는 「상법」 및 관련 법령에 따른다. 잔여 재산은 조합원 출자 비율에 따라 분배한다.</p>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <p><strong>업무집행자(대표)</strong></p>
          <p>성명: 윤정훈</p>
          <p>생년월일: 1981.08.22</p>
          <div class="signature-line"></div>
          <p style="font-size: 10px;">(서명 또는 날인)</p>
        </div>
        
        <div class="signature-box">
          <p><strong>조합원</strong></p>
          <p>성명: ${name}</p>
          <p>생년월일: ${formatBirthDate(birthDate)}</p>
          ${signature ? `<img src="${signature}" alt="전자서명" class="signature-img">` : '<div class="signature-line"></div>'}
          <p style="font-size: 10px;">(서명 또는 날인)</p>
        </div>
      </div>

      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666;">
        <p>본 계약서는 NIA CLOUD 시스템을 통해 전자적으로 생성되었습니다.</p>
        <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
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