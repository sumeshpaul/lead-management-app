import { NextResponse } from 'next/server';
import { sendWhatsAppVerification } from '@/lib/twilio-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneNumber = searchParams.get('phone');

  if (!phoneNumber) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
  }

  try {
    console.log('Initiating test WhatsApp message...');
    const result = await sendWhatsAppVerification(phoneNumber, '123456');
    console.log('Test result:', result);

    if (result.success) {
      return NextResponse.json({
        message: 'Test message sent successfully',
        messageId: result.messageId,
        status: result.status
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}