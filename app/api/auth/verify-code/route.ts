import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    // Check if the verification code is valid and not expired
    const verificationCodes = await query(
      'SELECT * FROM verification_codes WHERE phone_number = $1 AND code = $2 AND expires_at > NOW()',
      [phoneNumber, code]
    );

    if (verificationCodes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid or expired verification code' }, { status: 400 });
    }

    const verificationCode = verificationCodes.rows[0];

    // Delete the used verification code
    await query('DELETE FROM verification_codes WHERE id = $1', [verificationCode.id]);

    // Get the user
    const users = await query('SELECT * FROM users WHERE phone_number = $1', [phoneNumber]);

    if (users.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const user = users.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phone_number },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
      }
    });
  } catch (error) {
    console.error('Error in verify code API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}