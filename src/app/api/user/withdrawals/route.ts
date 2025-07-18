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

    const withdrawals = await databaseService.findWithdrawalsByUserId(parseInt(decoded.userId));
    
    // Add funding details to each withdrawal
    const withdrawalsWithDetails = withdrawals.map((withdrawal: Record<string, any>) => {
      const funding = fundingOptions.find(f => f.id === withdrawal.fundingId);
      return {
        ...withdrawal,
        fundingTitle: funding?.title || 'Unknown',
        fundingUnit: funding?.unit || 'Won'
      };
    });

    return NextResponse.json(withdrawalsWithDetails);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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

    const { amount, fundingId } = await request.json();

    if (!amount || !fundingId) {
      return NextResponse.json(
        { message: 'Amount and funding ID are required' },
        { status: 400 }
      );
    }

    const withdrawalRequest = {
      userId: parseInt(decoded.userId),
      amount: parseFloat(amount),
      fundingId,
      status: 'pending' as const,
      requestDate: new Date(),
    };

    const newWithdrawal = await databaseService.createWithdrawal(withdrawalRequest);

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawalId: newWithdrawal.id
    });
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}