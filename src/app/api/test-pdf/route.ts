import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing PDF generation functionality...');
    
    const testHtml = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF Test</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
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
          .content {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">PDF 생성 테스트</div>
          <div>테스트 ID: TEST_${Date.now()}</div>
        </div>
        <div class="content">
          <h3>테스트 내용</h3>
          <p>이것은 PDF 생성 기능을 테스트하기 위한 문서입니다.</p>
          <p>생성 시간: ${new Date().toLocaleString('ko-KR')}</p>
          <p>한글 문자가 정상적으로 표시되는지 확인합니다.</p>
        </div>
      </body>
      </html>
    `;
    
    const pdfBuffer = await generateTestPDF(testHtml);
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="test-pdf-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('PDF test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'PDF test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function generateTestPDF(html: string): Promise<Buffer> {
  let browser;
  let page;
  const startTime = Date.now();
  
  try {
    console.log('=== TEST PDF GENERATION START ===');
    
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
        '--max_old_space_size=4096'
      ],
      timeout: 60000,
    });
    
    console.log('Browser launched in', Date.now() - startTime, 'ms');
    
    page = await browser.newPage();
    await page.setDefaultTimeout(45000);
    await page.setViewport({ width: 1200, height: 1600 });
    
    console.log('Setting content...');
    await page.setContent(html, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      preferCSSPageSize: false,
      timeout: 30000
    });
    
    console.log('Test PDF generated successfully, size:', pdfBuffer.length);
    
    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty');
    }
    
    return Buffer.from(pdfBuffer);
    
  } catch (error) {
    console.error('Test PDF generation error:', error);
    throw error;
  } finally {
    try {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log('Test PDF cleanup completed');
    } catch (cleanupError) {
      console.error('Test PDF cleanup error:', cleanupError);
    }
  }
}