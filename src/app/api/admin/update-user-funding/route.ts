import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users, purchases } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { UserService } from '@/lib/db/userService';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
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

    const { email, fundingId, amount, accumulatedIncome } = await request.json();

    // Find user by email
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!targetUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = targetUser[0].id;

    // Check existing purchase
    const existingPurchase = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.userId, userId),
          eq(purchases.fundingId, fundingId)
        )
      );

    if (existingPurchase.length > 0) {
      // Update existing purchase
      await db
        .update(purchases)
        .set({
          quantity: amount,
          price: amount.toString(),
          accumulatedIncome: accumulatedIncome.toString(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(purchases.userId, userId),
            eq(purchases.fundingId, fundingId)
          )
        );
    } else {
      // Create new purchase
      await db.insert(purchases).values({
        userId: userId,
        fundingId: fundingId,
        quantity: amount,
        price: amount.toString(),
        accumulatedIncome: accumulatedIncome.toString(),
        contractSigned: true,
        lastIncomeUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Funding data updated successfully',
      user: targetUser[0].name,
      fundingId: fundingId,
      amount: amount,
      accumulatedIncome: accumulatedIncome
    });
  } catch (error) {
    console.error('Error updating funding data:', error);
    return NextResponse.json(
      { error: 'Failed to update funding data' },
      { status: 500 }
    );
  }
}