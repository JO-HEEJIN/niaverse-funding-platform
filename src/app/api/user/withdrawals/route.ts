import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { WithdrawalService } from '@/lib/db/withdrawalService';
import { PurchaseService } from '@/lib/db/purchaseService';
import { fundingOptions } from '@/lib/fundingData';

// 출금 관련 상수
const MIN_WITHDRAWAL_AMOUNT = 500000; // 50만원
const MAX_DAILY_WITHDRAWALS = 3;
const WITHDRAWAL_FEE_RATE = 0.03; // 3%

export async function GET(request: NextRequest) {
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

    // 사용자의 출금 내역 조회
    const withdrawals = await WithdrawalService.getByUserId(parseInt(decoded.userId));
    
    // 오늘 출금 횟수 확인
    const todayWithdrawals = await WithdrawalService.getTodayWithdrawalsCount(parseInt(decoded.userId));
    
    // 총 출금 횟수 확인 (첫 출금 여부)
    const totalWithdrawals = await WithdrawalService.getUserTotalWithdrawals(parseInt(decoded.userId));

    return NextResponse.json({
      withdrawals,
      limits: {
        minAmount: MIN_WITHDRAWAL_AMOUNT,
        maxDailyWithdrawals: MAX_DAILY_WITHDRAWALS,
        todayWithdrawals,
        remainingToday: MAX_DAILY_WITHDRAWALS - todayWithdrawals,
        feeRate: WITHDRAWAL_FEE_RATE,
        isFirstWithdrawalFree: totalWithdrawals === 0
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { message: '출금 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

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
    const { amount, fundingId } = body;

    // 입력 검증
    if (!amount || !fundingId || amount <= 0) {
      return NextResponse.json(
        { message: '출금 금액과 펀딩을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 최소 출금 금액 확인
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { message: `최소 출금 금액은 ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    // 일일 출금 횟수 확인
    const todayWithdrawals = await WithdrawalService.getTodayWithdrawalsCount(parseInt(decoded.userId));
    if (todayWithdrawals >= MAX_DAILY_WITHDRAWALS) {
      return NextResponse.json(
        { message: `일일 출금 횟수를 초과했습니다. (최대 ${MAX_DAILY_WITHDRAWALS}회)` },
        { status: 400 }
      );
    }

    // 사용자의 해당 펀딩 수익 확인
    const userPurchases = await PurchaseService.getByUserId(decoded.userId);
    const fundingPurchases = userPurchases.filter(p => 
      p.fundingId === fundingId && p.approved && p.contractSigned
    );

    if (fundingPurchases.length === 0) {
      return NextResponse.json(
        { message: '해당 펀딩에서 출금 가능한 수익이 없습니다.' },
        { status: 400 }
      );
    }

    // 총 수익 계산
    const totalIncome = fundingPurchases.reduce((sum, p) => sum + (p.accumulatedIncome || 0), 0);
    
    if (amount > totalIncome) {
      return NextResponse.json(
        { message: '출금 요청 금액이 보유 수익을 초과합니다.' },
        { status: 400 }
      );
    }

    // 출금 수수료 계산 (첫 출금은 무료)
    const totalWithdrawals = await WithdrawalService.getUserTotalWithdrawals(parseInt(decoded.userId));
    const isFirstWithdrawal = totalWithdrawals === 0;
    const fee = isFirstWithdrawal ? 0 : Math.floor(amount * WITHDRAWAL_FEE_RATE);
    const finalAmount = amount - fee;

    // 펀딩 정보 가져오기
    const funding = fundingOptions.find(f => `funding-${f.id}` === fundingId);
    const fundingTitle = funding ? funding.title : fundingId;

    // 출금 요청 생성
    const withdrawal = {
      userId: parseInt(decoded.userId),
      fundingId,
      amount,
      status: 'pending' as const,
      adminNotes: `${fundingTitle}에서 출금 요청${isFirstWithdrawal ? ' (첫 출금 - 수수료 무료)' : ''} - 수수료: ${fee}원, 실수령액: ${finalAmount}원`
    };

    const withdrawalId = await WithdrawalService.create(withdrawal);

    return NextResponse.json({
      success: true,
      message: '출금 요청이 성공적으로 제출되었습니다.',
      data: {
        withdrawalId,
        amount,
        fee,
        finalAmount,
        isFirstWithdrawal,
        dailyWithdrawalsRemaining: MAX_DAILY_WITHDRAWALS - todayWithdrawals - 1
      }
    });

  } catch (error) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json(
      { message: '출금 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}