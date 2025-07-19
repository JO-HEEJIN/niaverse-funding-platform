import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing JWT functionality...');
    
    // Test JWT creation
    const testPayload = { userId: 'test123', email: 'test@example.com' };
    const secret = process.env.JWT_SECRET || 'secret';
    
    const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
    console.log('JWT token created');
    
    // Test JWT verification
    const decoded = jwt.verify(token, secret) as any;
    console.log('JWT token verified');
    
    return NextResponse.json({
      status: 'success',
      message: 'JWT functionality working',
      data: {
        secretSet: !!process.env.JWT_SECRET,
        secretLength: secret.length,
        tokenCreated: !!token,
        payloadMatches: decoded.userId === testPayload.userId && decoded.email === testPayload.email
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('JWT test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'JWT test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        status: 'error',
        message: 'No authorization header provided',
        expected: 'Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'secret';
    
    const decoded = jwt.verify(token, secret) as any;
    
    return NextResponse.json({
      status: 'success',
      message: 'Token verification successful',
      data: {
        userId: decoded.userId,
        email: decoded.email,
        exp: decoded.exp,
        iat: decoded.iat
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('JWT verification error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Token verification failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 401 });
  }
}