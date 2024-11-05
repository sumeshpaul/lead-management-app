import { NextResponse } from 'next/server';
import { sendWhatsAppVerification, generateVerificationCode } from '@/lib/twilio-service';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    const verificationCode = generateVerificationCode(phoneNumber);
    
    // Store the code in the database with an expiration time
    await query(
      'INSERT INTO verification_codes (phone_number, code, expires_at) VALUES ($1, $2, $3)',
      [phoneNumber, verificationCode, new Date(Date.now() + 10 * 60 * 1000)] // Code expires in 10 minutes
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