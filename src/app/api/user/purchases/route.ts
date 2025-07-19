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

    const purchases = await PurchaseService.findByUserId(decoded.userId);
    
    // Filter only approved purchases
    const approvedPurchases = purchases.filter((purchase: any) => purchase.approved === true);
    
    // Add funding details to each purchase
    const purchasesWithDetails = approvedPurchases.map((purchase: Record<string, any>) => {
      const funding = fundingOptions.find(f => f.id === purchase.fundingId);
      return {
        ...purchase,
        fundingTitle: funding?.title || 'Unknown',
        fundingUnit: funding?.unit || 'Won'
      };
    });

    return NextResponse.json(purchasesWithDetails);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}