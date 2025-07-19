import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { WithdrawalService } from '@/lib/db/withdrawalService';
import { UserService } from '@/lib/db/userService';
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
    console.log('Admin check - decoded object:', decoded);
    console.log('Admin check - decoded.userId:', decoded.userId, 'type:', typeof decoded.userId);
    
    if (!decoded.userId) {
      return NextResponse.json(
        { 
          message: 'Forbidden - No userId in token', 
          debug: { 
            decodedToken: decoded,
            hasUserId: !!decoded.userId
          } 
        },
        { status: 403 }
      );
    }
    
    // Handle both string and numeric user IDs
    let user;
    if (decoded.userId.toString().startsWith('admin_')) {
      // For admin users with string IDs, find by email instead
      user = await UserService.findByEmail(decoded.email);
      console.log('Admin check - found user by email:', user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : 'null');
    } else {
      // For regular users with numeric IDs
      const userId = parseInt(decoded.userId);
      console.log('Admin check - parsed userId:', userId);
      
      if (isNaN(userId)) {
        return NextResponse.json(
          { 
            message: 'Forbidden - Invalid userId format', 
            debug: { 
              originalUserId: decoded.userId,
              parsedUserId: userId,
              isNaN: isNaN(userId)
            } 
          },
          { status: 403 }
        );
      }
      
      user = await UserService.findById(userId);
      console.log('Admin check - found user by ID:', user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : 'null');
    }
    console.log('Admin check - found user:', user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : 'null');
    
    if (!user?.isAdmin) {
      return NextResponse.json(
        { 
          message: 'Forbidden - Admin access required', 
          debug: { 
            userId, 
            parsedUserId: parseInt(decoded.userId),
            foundUser: !!user, 
            isAdmin: user?.isAdmin,
            userDetails: user ? { id: user.id, email: user.email, isAdmin: user.isAdmin } : null,
            decodedToken: { userId: decoded.userId, email: decoded.email }
          } 
        },
        { status: 403 }
      );
    }

    const withdrawals = await WithdrawalService.getAll();
    
    // Add user and funding details to each withdrawal
    const withdrawalsWithDetails = await Promise.all(withdrawals.map(async (withdrawal) => {
      const user = await UserService.findById(withdrawal.userId);
      const funding = fundingOptions.find(f => `funding-${f.id}` === withdrawal.fundingId);
      return {
        ...withdrawal,
        userName: user?.name || 'Unknown User',
        fundingTitle: funding?.title || 'Unknown Funding',
        fundingUnit: funding?.unit || 'Won'
      };
    }));

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
    let user;
    if (decoded.userId.toString().startsWith('admin_')) {
      // For admin users with string IDs, find by email instead
      user = await UserService.findByEmail(decoded.email);
    } else {
      // For regular users with numeric IDs
      const userId = parseInt(decoded.userId);
      if (isNaN(userId)) {
        return NextResponse.json(
          { message: 'Forbidden - Invalid userId format' },
          { status: 403 }
        );
      }
      user = await UserService.findById(userId);
    }
    
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

    const success = await WithdrawalService.updateStatus(parseInt(withdrawalId), status, adminNotes);

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