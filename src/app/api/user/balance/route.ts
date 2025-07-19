import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PurchaseService } from '@/lib/db/purchaseService';
import { fundingOptions } from '@/lib/fundingData';

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

    // Get user's purchases
    const purchases = await PurchaseService.findByUserId(decoded.userId);
    
    // Calculate balances by funding type
    const balances = {
      doge: {
        invested: 0,
        accumulated: 0,
        withdrawalEnabled: true,
        unit: 'Doge'
      },
      krw: {
        invested: 0,
        accumulated: 0,
        withdrawalEnabled: true,
        unit: 'KRW'
      },
      vast: {
        invested: 0,
        accumulated: 0,
        withdrawalEnabled: false,
        unit: 'VAST'
      }
    };

    purchases.forEach(purchase => {
      if (!purchase.contractSigned) return;

      const funding = fundingOptions.find(f => `funding-${f.id}` === purchase.fundingId);
      if (!funding) return;

      switch (funding.id) {
        case '1': // 펀딩 I - Doge
          balances.doge.invested += purchase.quantity;
          balances.doge.accumulated += purchase.accumulatedIncome || 0;
          break;
        case '2': // 펀딩 II - Data Center
          balances.krw.invested += 1; // count of investments
          balances.krw.accumulated += purchase.accumulatedIncome || 0;
          break;
        case '3': // 펀딩 III - VAST
          balances.vast.invested += purchase.quantity;
          balances.vast.accumulated += purchase.accumulatedIncome || 0;
          break;
      }
    });

    return NextResponse.json({
      balances,
      totalInvestments: purchases.length
    });

  } catch (error) {
    console.error('Error fetching user balance:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}