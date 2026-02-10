import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { success: false, error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    const verificationCodes = await query(
      'SELECT * FROM verification_codes WHERE phone_number = $1 AND code = $2 AND expires_at > NOW()',
      [phoneNumber, code]
    );

    if (verificationCodes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    const verificationCode = verificationCodes.rows[0];

    // Delete the used verification code
    await query('DELETE FROM verification_codes WHERE id = $1', [verificationCode.id]);

    // Clean up expired codes for this phone number
    await query(
      'DELETE FROM verification_codes WHERE phone_number = $1 AND expires_at <= NOW()',
      [phoneNumber]
    );

    // Get the user
    const users = await query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

    if (users.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users.rows[0];

    // Generate JWT token
    const token = signToken({ userId: user.id, phoneNumber: user.phone_number });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
      }
    });

    // Set HttpOnly cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error in verify code API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
