import { NextResponse } from 'next/server';
import { sendWhatsAppVerification, generateVerificationCode, verifyCode } from '@/lib/twilio-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, action, code } = body;

    if (action === 'send') {
      const verificationCode = generateVerificationCode(phoneNumber);
      const result = await sendWhatsAppVerification(phoneNumber, verificationCode);
      
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, messageId: result.messageId });
    }

    if (action === 'verify') {
      const isValid = verifyCode(phoneNumber, code);
      
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid verification code' }, { status: 400 });
      }

      return NextResponse.json({ success: true, phoneNumber });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}