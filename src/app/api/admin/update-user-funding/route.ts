import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';
import { PurchaseService } from '@/lib/db/purchaseService';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://niaverse_admin:Qlalfqjsgh1@niaverse-db.ch8meqesioqg.us-east-2.rds.amazonaws.com:5432/niaverse',
  ssl: {
    rejectUnauthorized: false
  }
});

// ID 생성 함수
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
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

    console.log('Update request data:', { email, fundingId, amount, accumulatedIncome });

    // Input validation
    if (!email || !fundingId || amount === undefined || accumulatedIncome === undefined) {
      return NextResponse.json({
        message: 'Missing required fields',
        required: ['email', 'fundingId', 'amount', 'accumulatedIncome'],
        received: { email, fundingId, amount, accumulatedIncome }
      }, { status: 400 });
    }

    // Validate amount and accumulatedIncome are numbers
    if (isNaN(Number(amount)) || isNaN(Number(accumulatedIncome))) {
      return NextResponse.json({
        message: 'Amount and accumulatedIncome must be numbers',
        received: { amount: typeof amount, accumulatedIncome: typeof accumulatedIncome }
      }, { status: 400 });
    }

    await client.query('BEGIN');

    // Find user by email
    const userResult = await client.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { message: 'User not found', email: email },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;
    const userName = userResult.rows[0].name;

    // Check existing purchase
    const existingResult = await client.query(
      'SELECT id FROM purchases WHERE user_id = $1 AND funding_id = $2',
      [userId, fundingId]
    );

    // Calculate quantity and price based on funding type
    let quantity = Number(amount);
    let price = Number(amount);
    
    if (fundingId === 'funding-3') {
      // For VAST, quantity is amount/1000 (1000원 = 1 VAST)
      quantity = Math.floor(Number(amount) / 1000);
      price = Number(amount); // Price in won
    } else if (fundingId === 'funding-1') {
      // For Doge mining, amount is the number of mining units (quantity)
      // Admin inputs quantity directly, calculate price as quantity * 1M won
      quantity = Number(amount);
      price = quantity * 1000000; // 1 mining unit = 1M won
    } else {
      // For funding-2 (Data Center), amount is price in won
      quantity = Number(amount);
      price = Number(amount);
    }

    if (existingResult.rows.length > 0) {
      // Update existing purchase
      await client.query(
        `UPDATE purchases 
         SET quantity = $1, price = $2, accumulated_income = $3, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND funding_id = $5`,
        [quantity, price.toString(), accumulatedIncome.toString(), userId, fundingId]
      );
    } else {
      // Create new purchase with generated ID
      const purchaseId = generateId();
      await client.query(
        `INSERT INTO purchases (id, user_id, funding_id, quantity, price, accumulated_income, contract_signed, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [purchaseId, userId, fundingId, quantity, price.toString(), accumulatedIncome.toString()]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Funding data updated successfully',
      user: userName,
      fundingId: fundingId,
      amount: Number(amount),
      price: price,
      accumulatedIncome: Number(accumulatedIncome),
      quantity: quantity
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating funding data:', error);
    return NextResponse.json(
      { 
        message: 'Failed to update funding data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}