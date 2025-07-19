import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserService } from '@/lib/db/userService';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
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
    const { password, phone, address } = body;

    // Validate input
    if (phone && !/^[0-9-+\s()]+$/.test(phone)) {
      return NextResponse.json(
        { message: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await UserService.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (password && password.trim()) {
      // Hash new password
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    
    if (address !== undefined) {
      updateData.address = address.trim();
    }

    // Update user
    const success = await UserService.updateUser(decoded.userId, updateData);
    
    if (success) {
      return NextResponse.json(
        { message: '회원정보가 성공적으로 수정되었습니다.' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: '회원정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}