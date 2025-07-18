import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { fileStorage } from '@/lib/fileStorage';

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
    const { purchaseData, personalInfo, signature, timestamp } = body;

    // Validate required fields
    if (!purchaseData || !personalInfo || !signature || !timestamp) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create purchase record
    const purchase = {
      id: Date.now().toString(),
      userId: decoded.userId,
      fundingId: purchaseData.fundingId,
      quantity: purchaseData.quantity,
      price: purchaseData.price,
      timestamp: new Date(timestamp),
      contractSigned: true,
      contractData: {
        personalInfo,
        signature,
      },
      accumulatedIncome: 0,
      lastIncomeUpdate: new Date(timestamp),
    };

    fileStorage.addPurchase(purchase);

    return NextResponse.json(
      { 
        message: 'Contract signed successfully',
        purchaseId: purchase.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contract submission error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}