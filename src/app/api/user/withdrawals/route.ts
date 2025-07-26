import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { WithdrawalService } from '@/lib/db/withdrawalService';
import { PurchaseService } from '@/lib/db/purchaseService';
import { fundingOptions } from '@/lib/fundingData';
import * as nodemailer from 'nodemailer';

// 출금 관련 상수
const MIN_WITHDRAWAL_AMOUNT = 10000; // 1만원 (기존 50만원에서 인하)
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
    const { amount, fundingId, bankInfo } = body;

    // 입력 검증
    if (!amount || !fundingId || amount <= 0) {
      return NextResponse.json(
        { message: '출금 금액과 펀딩을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!bankInfo || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      return NextResponse.json(
        { message: '은행명, 계좌번호, 예금주명을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 펀딩별 출금 규칙 확인
    const funding = fundingOptions.find(f => f.id === fundingId);
    if (!funding) {
      return NextResponse.json(
        { message: '존재하지 않는 펀딩입니다.' },
        { status: 400 }
      );
    }

    // 펀딩 3 (VAST)는 출금 불가
    if (funding.id === 'funding-3') {
      return NextResponse.json(
        { message: 'VAST는 출금이 불가능합니다.' },
        { status: 400 }
      );
    }

    // 펀딩별 최소 출금 금액 확인
    let minAmount = MIN_WITHDRAWAL_AMOUNT;
    let unit = '원';
    
    if (funding.id === 'funding-1') {
      // 펀딩 I (Doge) - 개수 단위, 최소 1개
      minAmount = 1;
      unit = 'Doge';
    } else if (funding.id === 'funding-2') {
      // 펀딩 II (Data Center) - 원화 단위
      minAmount = MIN_WITHDRAWAL_AMOUNT;
      unit = '원';
    }

    if (amount < minAmount) {
      return NextResponse.json(
        { message: `최소 출금 ${unit === 'Doge' ? '개수' : '금액'}는 ${minAmount.toLocaleString()}${unit}입니다.` },
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

    const fundingTitle = funding.title;
    const fundingUnit = funding.unit;

    // 출금 요청 생성
    const withdrawal = {
      userId: parseInt(decoded.userId),
      fundingId,
      amount,
      status: 'pending' as const,
      adminNotes: `${fundingTitle}에서 출금 요청${isFirstWithdrawal ? ' (첫 출금 - 수수료 무료)' : ''} - 출금량: ${amount}${fundingUnit === 'Doge' ? ' Doge' : '원'}, 수수료: ${fee}원, 실수령액: ${finalAmount}${fundingUnit === 'Doge' ? ' Doge' : '원'} - 계좌: ${bankInfo.bankName} ${bankInfo.accountNumber} (${bankInfo.accountHolder})`
    };

    const withdrawalId = await WithdrawalService.create(withdrawal);

    // 이메일 전송 (관리자에게)
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await sendWithdrawalNotificationEmail({
          withdrawalId,
          userEmail: decoded.email,
          fundingTitle,
          amount,
          fundingUnit,
          fee,
          finalAmount,
          isFirstWithdrawal,
          bankInfo
        });
      }
    } catch (emailError) {
      console.error('이메일 전송 실패:', emailError);
      // 이메일 전송 실패해도 출금 요청은 성공으로 처리
    }

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

// 출금 알림 이메일 전송 함수
async function sendWithdrawalNotificationEmail(data: {
  withdrawalId: number;
  userEmail: string;
  fundingTitle: string;
  amount: number;
  fundingUnit: string;
  fee: number;
  finalAmount: number;
  isFirstWithdrawal: boolean;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}) {
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
    subject: `[NIA Cloud] 출금 요청 알림 - ${data.fundingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          💰 NIA Cloud 출금 요청 알림
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">출금 요청 정보</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">요청 ID:</td>
              <td style="padding: 8px 0;">${data.withdrawalId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">사용자 이메일:</td>
              <td style="padding: 8px 0;">${data.userEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">펀딩:</td>
              <td style="padding: 8px 0;">${data.fundingTitle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">출금 요청액:</td>
              <td style="padding: 8px 0; color: #1f2937; font-weight: bold;">
                ${data.amount.toLocaleString()}${data.fundingUnit === 'Doge' ? ' Doge' : '원'}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">수수료:</td>
              <td style="padding: 8px 0;">
                ${data.isFirstWithdrawal ? '무료 (첫 출금)' : `${data.fee.toLocaleString()}원`}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">실 지급액:</td>
              <td style="padding: 8px 0; color: #059669; font-weight: bold;">
                ${data.finalAmount.toLocaleString()}${data.fundingUnit === 'Doge' ? ' Doge' : '원'}
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0;">💳 입금 계좌 정보</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold; color: #92400e;">은행:</td>
              <td style="padding: 5px 0; font-weight: bold;">${data.bankInfo.bankName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold; color: #92400e;">계좌번호:</td>
              <td style="padding: 5px 0; font-family: monospace; font-size: 16px;">${data.bankInfo.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold; color: #92400e;">예금주:</td>
              <td style="padding: 5px 0; font-weight: bold;">${data.bankInfo.accountHolder}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-radius: 8px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            📋 <strong>처리 안내:</strong> 관리자 패널에서 출금 요청을 확인하고 승인 처리해 주세요.
          </p>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>요청 시간: ${new Date().toLocaleString('ko-KR')}</p>
          <p>NIA Cloud 출금 관리 시스템</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}