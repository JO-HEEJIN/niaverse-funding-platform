import { NextRequest, NextResponse } from 'next/server';
import { fileStorage } from '@/lib/fileStorage';
import { fundingOptions } from '@/lib/fundingData';

export async function POST(request: NextRequest) {
  try {
    // In production, this should be protected and run as a scheduled job
    const purchases = fileStorage.getAllPurchases();
    const now = new Date();
    let updatedCount = 0;

    purchases.forEach(purchase => {
      if (!purchase.contractSigned) return;

      // Find the funding option
      const funding = fundingOptions.find(f => f.id === purchase.fundingId);
      if (!funding) return;

      // Calculate days since last update or purchase
      const lastUpdate = purchase.lastIncomeUpdate ? new Date(purchase.lastIncomeUpdate) : new Date(purchase.timestamp);
      const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > 0) {
        // Calculate income based on funding type
        let dailyIncome = 0;
        
        if (funding.id === '1' && funding.dailyIncome) {
          // Dogecoin: Fixed daily income per unit
          dailyIncome = purchase.quantity * funding.dailyIncome * daysDiff;
        } else if (funding.id === '2') {
          // Data Center: Calculate based on investment amount (e.g., 0.1% daily)
          dailyIncome = purchase.price * 0.001 * daysDiff;
        } else if (funding.id === '3') {
          // VAST coin: Variable income (e.g., 0.5-1.5% daily)
          const rate = 0.005 + Math.random() * 0.01; // Random between 0.5% and 1.5%
          dailyIncome = purchase.quantity * 1000 * rate * daysDiff; // Assuming 1000 Bast base value
        }

        const newIncome = (purchase.accumulatedIncome || 0) + dailyIncome;
        fileStorage.updatePurchaseIncome(purchase.id, newIncome);
        updatedCount++;
      }
    });

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