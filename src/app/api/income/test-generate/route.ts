import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PurchaseService } from '@/lib/db/purchaseService';
import { fundingOptions } from '@/lib/fundingData';

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

    // Get user's purchases
    const purchases = await PurchaseService.getByUserId(decoded.userId);
    let updatedCount = 0;

    for (const purchase of purchases) {
      if (!purchase.approved) continue; // Only process approved purchases

      // Find the funding option
      const funding = fundingOptions.find(f => `funding-${f.id}` === purchase.fundingId);
      if (!funding) continue;

      // Calculate test income (simulate 30 days of income)
      let testIncome = 0;
      const simulatedDays = 30;
      
      if (funding.id === '1' && funding.dailyIncome) {
        // Dogecoin: Fixed daily income per unit
        testIncome = purchase.quantity * funding.dailyIncome * simulatedDays;
      } else if (funding.id === '2') {
        // Data Center: Calculate based on investment amount (0.1% daily)
        testIncome = purchase.price * 0.001 * simulatedDays;
      } else if (funding.id === '3') {
        // VAST coin: Average 1% daily
        const rate = 0.01; // 1% daily
        testIncome = purchase.quantity * 1000 * rate * simulatedDays;
      }

      // Update purchase with test income
      const success = await PurchaseService.updateIncome(purchase.id, testIncome);
      if (success) {
        updatedCount++;
      }
    }

    return NextResponse.json({
      message: `테스트 수익금이 ${updatedCount}개 구매건에 생성되었습니다.`,
      updatedCount,
      note: "30일치 수익금이 시뮬레이션되었습니다."
    });
  } catch (error) {
    console.error('Error generating test income:', error);
    return NextResponse.json(
      { message: 'Failed to generate test income' },
      { status: 500 }
    );
  }
}

// GET endpoint for info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'POST to generate test income for approved purchases',
    description: 'This endpoint simulates 30 days of income for testing withdrawal functionality'
  });
}