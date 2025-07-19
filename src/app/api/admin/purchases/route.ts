import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';
import { PurchaseService } from '@/lib/db/purchaseService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Check if user is admin
    const user = await UserService.findById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get all purchases
    const purchases = await PurchaseService.getAll();
    
    // Add user info to each purchase
    const purchasesWithUserInfo = await Promise.all(
      purchases.map(async (purchase: any) => {
        const purchaseUser = await UserService.findById(purchase.userId);
        return {
          ...purchase,
          userName: purchaseUser?.name || 'Unknown',
          userEmail: purchaseUser?.email || 'Unknown',
        };
      })
    );

    return NextResponse.json(purchasesWithUserInfo);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Check if user is admin
    const user = await UserService.findById(decoded.userId);
    if (!user?.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { purchaseId, action } = await request.json();

    if (action === 'approve') {
      const success = await PurchaseService.approvePurchase(purchaseId, user.email);
      if (success) {
        return NextResponse.json({ message: 'Purchase approved successfully' });
      }
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}