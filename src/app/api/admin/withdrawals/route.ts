import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fileStorage } from '@/lib/fileStorage';
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

    // Check if user is admin
    const user = fileStorage.findUserById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const withdrawals = fileStorage.getAllWithdrawals();
    
    // Add user and funding details to each withdrawal
    const withdrawalsWithDetails = withdrawals.map(withdrawal => {
      const user = fileStorage.findUserById(withdrawal.userId);
      const funding = fundingOptions.find(f => f.id === withdrawal.fundingId);
      return {
        ...withdrawal,
        userName: user?.name || 'Unknown User',
        fundingTitle: funding?.title || 'Unknown Funding',
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

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin
    const user = fileStorage.findUserById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { withdrawalId, status, adminNotes } = await request.json();

    if (!withdrawalId || !status) {
      return NextResponse.json(
        { message: 'Withdrawal ID and status are required' },
        { status: 400 }
      );
    }

    const success = fileStorage.updateWithdrawalStatus(withdrawalId, status, adminNotes);

    if (success) {
      return NextResponse.json({
        message: `Withdrawal ${status} successfully`
      });
    } else {
      return NextResponse.json(
        { message: 'Withdrawal not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}