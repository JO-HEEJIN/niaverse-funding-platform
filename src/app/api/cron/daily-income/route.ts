/**
 * 일일 수익 계산 Cron Job API
 * 
 * 이 엔드포인트는 외부 cron 서비스(예: cron-job.org, GitHub Actions)나 
 * AWS Lambda/Vercel Cron에 의해 매일 자정에 호출됩니다.
 * 
 * 보안을 위해 인증 토큰을 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DailyIncomeService } from '@/lib/services/dailyIncomeService';

// Cron job 인증을 위한 비밀 키
const CRON_SECRET = process.env.CRON_SECRET || 'niaverse-daily-income-2024';

export async function POST(request: NextRequest) {
  console.log('\n🚀 Daily Income Cron Job Started');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`User-Agent: ${request.headers.get('user-agent')}`);
  
  try {
    // 1. 인증 확인
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || 
                          request.nextUrl.searchParams.get('secret');
    
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      console.error('❌ Unauthorized cron job request');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Invalid cron secret',
          timestamp: new Date().toISOString()
        }, 
        { status: 401 }
      );
    }

    console.log('✅ Cron job authentication successful');

    // 2. 수동 실행 모드 확인 (테스트용)
    const isManual = request.nextUrl.searchParams.get('manual') === 'true';
    if (isManual) {
      console.log('🔧 Manual execution mode detected');
    }

    // 3. 일일 수익 계산 실행
    console.log('💰 Starting daily income calculation...');
    const result = await DailyIncomeService.calculateAndUpdateDailyIncome();

    // 4. 결과 로깅
    if (result.success) {
      console.log('✅ Daily income calculation completed successfully');
    } else {
      console.error('❌ Daily income calculation completed with errors');
    }

    // 5. 응답 반환
    const response = {
      success: result.success,
      timestamp: new Date().toISOString(),
      statistics: {
        processed: result.processed,
        updated: result.updated,
        skipped: result.skipped,
        errorCount: result.errors.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
      executionMode: isManual ? 'manual' : 'scheduled'
    };

    console.log('📊 Final Result:', response);

    return NextResponse.json(response, { 
      status: result.success ? 200 : 500 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 Fatal error in cron job:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        statistics: {
          processed: 0,
          updated: 0,
          skipped: 0,
          errorCount: 1
        }
      },
      { status: 500 }
    );
  }
}

// GET 요청도 지원 (웹 브라우저에서 테스트용)
export async function GET(request: NextRequest) {
  // GET 요청은 manual=true로 처리
  const url = new URL(request.url);
  url.searchParams.set('manual', 'true');
  
  // POST로 리다이렉트
  return POST(new NextRequest(url, {
    method: 'POST',
    headers: request.headers
  }));
}