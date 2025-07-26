/**
 * 관리자용 수익 계산 API
 * 
 * 관리자가 수동으로 수익 계산을 실행할 수 있는 엔드포인트입니다.
 * JWT 토큰으로 관리자 권한을 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';
import { DailyIncomeService } from '@/lib/services/dailyIncomeService';

export async function POST(request: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    const user = await UserService.findById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    console.log(`[Admin] Manual income calculation triggered by ${user.email}`);

    // 2. 수익 계산 실행
    const result = await DailyIncomeService.calculateAndUpdateDailyIncome();

    // 3. 결과 반환
    return NextResponse.json({
      success: result.success,
      message: result.success ? 
        'Income calculation completed successfully' : 
        'Income calculation completed with errors',
      timestamp: new Date().toISOString(),
      executedBy: user.email,
      statistics: {
        processed: result.processed,
        updated: result.updated,
        skipped: result.skipped,
        errorCount: result.errors.length
      },
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error) {
    console.error('Admin income calculation error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to calculate income',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}