import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { UserService } from '@/lib/db/userService';

export async function DELETE(request: NextRequest) {
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

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Find user to delete
    const userToDelete = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!userToDelete.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting their own account
    if (userToDelete[0].id === decoded.userId) {
      return NextResponse.json({ message: 'Cannot delete your own admin account' }, { status: 400 });
    }

    // Delete user (CASCADE will handle related data)
    await db.delete(users).where(eq(users.email, email));

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete[0].name} (${email}) has been deleted successfully`,
      deletedUser: {
        name: userToDelete[0].name,
        email: userToDelete[0].email
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}