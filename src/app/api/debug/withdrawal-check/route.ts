import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PurchaseService } from '@/lib/db/purchaseService';
import { WithdrawalService } from '@/lib/db/withdrawalService';

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

    // Get user purchases
    const purchases = await PurchaseService.getByUserId(decoded.userId);
    
    // Get withdrawal info
    const todayWithdrawals = await WithdrawalService.getTodayWithdrawalsCount(parseInt(decoded.userId));
    const totalWithdrawals = await WithdrawalService.getUserTotalWithdrawals(parseInt(decoded.userId));

    // Analyze each purchase
    const purchaseAnalysis = purchases.map(purchase => {
      const accumulatedIncome = typeof purchase.accumulatedIncome === 'string' 
        ? parseFloat(purchase.accumulatedIncome) 
        : purchase.accumulatedIncome;
      
      return {
        id: purchase.id,
        fundingId: purchase.fundingId,
        price: purchase.price,
        quantity: purchase.quantity,
        accumulatedIncome: accumulatedIncome,
        accumulatedIncomeType: typeof purchase.accumulatedIncome,
        accumulatedIncomeRaw: purchase.accumulatedIncome,
        contractSigned: purchase.contractSigned,
        approved: purchase.approved,
        canWithdraw: purchase.contractSigned && purchase.approved,
        blockingReasons: [
          !purchase.contractSigned ? 'Contract not signed' : null,
          !purchase.approved ? 'Purchase not approved' : null,
          isNaN(accumulatedIncome) || accumulatedIncome <= 0 ? 'No accumulated income' : null
        ].filter(Boolean)
      };
    });

    // Calculate withdrawable amounts by funding
    const withdrawableByFunding = purchases.reduce((acc, purchase) => {
      if (!purchase.contractSigned || !purchase.approved) return acc;
      
      const accumulatedIncome = typeof purchase.accumulatedIncome === 'string' 
        ? parseFloat(purchase.accumulatedIncome) 
        : purchase.accumulatedIncome;
      
      if (isNaN(accumulatedIncome) || accumulatedIncome <= 0) return acc;
      
      if (!acc[purchase.fundingId]) {
        acc[purchase.fundingId] = {
          fundingId: purchase.fundingId,
          totalIncome: 0,
          purchases: []
        };
      }
      
      acc[purchase.fundingId].totalIncome += accumulatedIncome;
      acc[purchase.fundingId].purchases.push(purchase);
      
      return acc;
    }, {} as Record<string, any>);

    // Check withdrawal limits
    const MIN_WITHDRAWAL_AMOUNT = 500000; // 50만원
    const MAX_DAILY_WITHDRAWALS = 3;

    const withdrawalAnalysis = {
      todayWithdrawals,
      totalWithdrawals,
      remainingToday: MAX_DAILY_WITHDRAWALS - todayWithdrawals,
      isFirstWithdrawalFree: totalWithdrawals === 0,
      canMakeWithdrawal: todayWithdrawals < MAX_DAILY_WITHDRAWALS,
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT
    };

    // Check each funding's withdrawal eligibility
    const fundingEligibility = Object.entries(withdrawableByFunding).map(([fundingId, data]: [string, any]) => {
      let canWithdraw = false;
      let minAmount = MIN_WITHDRAWAL_AMOUNT;
      let reasons = [];

      // Check funding-specific rules
      if (fundingId === 'funding-1') {
        minAmount = 1; // 1 Doge
        canWithdraw = data.totalIncome >= minAmount;
        if (!canWithdraw) reasons.push(`Minimum 1 Doge required, has ${data.totalIncome}`);
      } else if (fundingId === 'funding-2') {
        minAmount = MIN_WITHDRAWAL_AMOUNT; // 500,000 KRW
        canWithdraw = data.totalIncome >= minAmount;
        if (!canWithdraw) reasons.push(`Minimum ${MIN_WITHDRAWAL_AMOUNT.toLocaleString()} KRW required, has ${data.totalIncome.toLocaleString()}`);
      } else if (fundingId === 'funding-3') {
        canWithdraw = false;
        reasons.push('VAST withdrawals are disabled');
      }

      return {
        fundingId,
        totalIncome: data.totalIncome,
        purchaseCount: data.purchases.length,
        minAmount,
        canWithdraw,
        blockingReasons: reasons
      };
    });

    return NextResponse.json({
      success: true,
      userInfo: {
        userId: decoded.userId,
        email: decoded.email
      },
      purchaseAnalysis,
      withdrawableByFunding,
      withdrawalAnalysis,
      fundingEligibility,
      overallIssues: [
        purchases.length === 0 ? 'No purchases found' : null,
        Object.keys(withdrawableByFunding).length === 0 ? 'No withdrawable funds' : null,
        !withdrawalAnalysis.canMakeWithdrawal ? 'Daily withdrawal limit reached' : null
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('Withdrawal debug error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Debug check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}