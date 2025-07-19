import { NextRequest, NextResponse } from 'next/server';
import { PurchaseService } from '@/lib/db/purchaseService';
import { fundingOptions } from '@/lib/fundingData';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    // Basic auth check - in production this should be a proper admin auth or cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        jwt.verify(token, process.env.JWT_SECRET || 'secret');
        // Valid token, continue
      } catch (error) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        );
      }
    }
    // If no auth header, still allow for backward compatibility during transition
    
    const purchases = await PurchaseService.getAll();
    const now = new Date();
    let updatedCount = 0;
    
    // Monthly return rate: 5% per month
    // Daily return rate: 5% / 31 days = 0.161290% per day
    const MONTHLY_RETURN_RATE = 0.05;
    const DAILY_RETURN_RATE = MONTHLY_RETURN_RATE / 31;

    for (const purchase of purchases) {
      if (!purchase.contractSigned || !purchase.approved) continue;

      // Find the funding option
      const funding = fundingOptions.find(f => `funding-${f.id}` === purchase.fundingId);
      if (!funding) continue;

      // Calculate days since last update or purchase
      const lastUpdate = purchase.lastIncomeUpdate ? new Date(purchase.lastIncomeUpdate) : new Date(purchase.timestamp);
      const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0) {
        // Calculate income based on funding type
        // All funding types use the same 5% monthly return rate
        let dailyIncome = 0;
        let principal = 0;
        
        if (funding.id === '1') {
          // Doge coin: Daily income based on investment amount (price paid)
          principal = purchase.price;
          dailyIncome = principal * DAILY_RETURN_RATE * daysDiff;
        } else if (funding.id === '2') {
          // Data Center: Daily income based on investment amount
          principal = purchase.price;
          dailyIncome = principal * DAILY_RETURN_RATE * daysDiff;
        } else if (funding.id === '3') {
          // VAST coin: Daily income based on investment amount
          principal = purchase.price;
          dailyIncome = principal * DAILY_RETURN_RATE * daysDiff;
        }

        const currentIncome = purchase.accumulatedIncome || 0;
        const newIncome = currentIncome + dailyIncome;
        
        const success = await PurchaseService.updateIncome(purchase.id, newIncome);
        if (success) {
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      message: `Income calculated for ${updatedCount} purchases`,
      updatedCount
    });
  } catch (error) {
    console.error('Error calculating income:', error);
    return NextResponse.json(
      { message: 'Failed to calculate income' },
      { status: 500 }
    );
  }
}

// This endpoint could be called by a cron job or admin panel
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to calculate income'
  });
}