import { NextResponse } from 'next/server';
import { sendWhatsAppVerification } from '@/lib/twilio-service';
import { query } from '@/lib/db';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid phone number is required' },
        { status: 400 }
      );
    }

    // Rate limiting: check how many codes were sent in the last 5 minutes
    const recentCodes = await query(
      `SELECT COUNT(*) as count FROM verification_codes WHERE phone_number = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
      [phoneNumber]
    );

    if (parseInt(recentCodes.rows[0].count) >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please wait 5 minutes.' },
        { status: 429 }
      );
    }

    // Clean up expired codes for this phone number
    await query(
      'DELETE FROM verification_codes WHERE phone_number = $1 AND expires_at <= NOW()',
      [phoneNumber]
    );

    const verificationCode = generateCode();

    // Store the code in the database with an expiration time
    await query(
      'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES ($1, $2, $3)',
      [phoneNumber, verificationCode, new Date(Date.now() + 10 * 60 * 1000)]
    );

    const result = await sendWhatsAppVerification(phoneNumber, verificationCode);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('Error in send verification code API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
