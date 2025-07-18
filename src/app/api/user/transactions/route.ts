import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { databaseService } from '@/lib/db/service';
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

    const purchases = await databaseService.findPurchasesByUserId(parseInt(decoded.userId));
    const withdrawals = await databaseService.findWithdrawalsByUserId(parseInt(decoded.userId));
    const transactions = await databaseService.findTransactionsByUserId(parseInt(decoded.userId));

    const items: {
      id: string;
      type: string;
      fundingTitle: string;
      amount: number;
      unit: string;
      status: string;
      date: Date;
      details: string;
    }[] = [];

    // Add purchases
    purchases.forEach((purchase: Record<string, any>) => {
      const funding = fundingOptions.find(f => f.id === purchase.fundingId);
      if (funding && purchase.contractSigned) {
        items.push({
          id: purchase.id.toString(),
          type: 'purchase',
          fundingTitle: funding.title,
          amount: purchase.price,
          unit: 'Won',
          status: 'Completed',
          date: purchase.timestamp ? new Date(purchase.timestamp) : new Date(),
          details: `Purchased ${purchase.quantity} unit(s) of ${funding.title}`
        });
      }
    });

    // Add withdrawals
    withdrawals.forEach((withdrawal: Record<string, any>) => {
      const funding = fundingOptions.find(f => f.id === withdrawal.fundingId);
      if (funding) {
        items.push({
          id: withdrawal.id.toString(),
          type: 'withdrawal',
          fundingTitle: funding.title,
          amount: withdrawal.amount,
          unit: funding.unit,
          status: withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1),
          date: withdrawal.requestDate ? new Date(withdrawal.requestDate) : new Date(),
          details: `Withdrawal request for ${withdrawal.amount} ${funding.unit}`
        });
      }
    });

    // Add additional transactions if any
    transactions.forEach((transaction: Record<string, any>) => {
      const funding = fundingOptions.find(f => f.id === transaction.fundingId);
      if (funding && !items.find(item => item.id === transaction.id.toString())) {
        items.push({
          id: transaction.id.toString(),
          type: transaction.type,
          fundingTitle: funding.title,
          amount: transaction.amount,
          unit: 'Won',
          status: 'Completed',
          date: transaction.timestamp ? new Date(transaction.timestamp) : new Date(),
          details: transaction.details
        });
      }
    });

    // Sort by date (newest first)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}