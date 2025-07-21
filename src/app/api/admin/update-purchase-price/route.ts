import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users, purchases } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { UserService } from '@/lib/db/userService';

export async function PUT(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    
    // Check if user is admin
    const adminUser = await UserService.findById(decoded.userId);
    if (!adminUser?.isAdmin) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { email, fundingId, newPrice } = await request.json();

    if (!email || !fundingId || !newPrice) {
      return NextResponse.json({ message: 'Email, fundingId, and newPrice are required' }, { status: 400 });
    }

    if (newPrice < 0) {
      return NextResponse.json({ message: 'Price must be positive' }, { status: 400 });
    }

    // Find user by email
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!targetUser.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const userId = targetUser[0].id;

    // Find and update purchase
    const existingPurchases = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.userId, userId),
          eq(purchases.fundingId, fundingId)
        )
      );

    if (!existingPurchases.length) {
      return NextResponse.json({ 
        message: `No purchase found for user ${email} with funding ${fundingId}` 
      }, { status: 404 });
    }

    // Calculate new quantity based on funding type and price
    let newQuantity = 1; // Default quantity
    
    if (fundingId === 'funding-1') {
      // Doge: 1000원 = 1 Doge, so quantity in mining units
      newQuantity = Math.floor(newPrice / 1000000); // 1M won = 1 mining unit
    } else if (fundingId === 'funding-3') {
      // VAST: 1000원 = 1 VAST, so quantity represents VAST tokens purchased  
      newQuantity = newPrice / 1000; // Total VAST tokens
    } else {
      // Data Center: quantity represents units purchased
      newQuantity = Math.floor(newPrice / 1000000); // 1M won = 1 unit
    }

    // Update purchase price and quantity
    await db
      .update(purchases)
      .set({
        price: newPrice.toString(),
        quantity: newQuantity,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(purchases.userId, userId),
          eq(purchases.fundingId, fundingId)
        )
      );

    return NextResponse.json({
      success: true,
      message: `Purchase price updated successfully`,
      user: targetUser[0].name,
      fundingId: fundingId,
      oldPrice: existingPurchases[0].price,
      newPrice: newPrice,
      newQuantity: newQuantity
    });

  } catch (error) {
    console.error('Update purchase price error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}