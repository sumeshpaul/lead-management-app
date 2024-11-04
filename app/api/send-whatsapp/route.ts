import { NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()

    // Update the regex to accept numbers with or without + prefix
    const uaeNumberRegex = /^\+?971[0-9]{9}$/;
    if (!uaeNumberRegex.test(to)) {
      console.error('Invalid phone number format:', to);
      return NextResponse.json(
        { error: `Invalid UAE mobile number format: ${to}` },
        { status: 400 }
      );
    }

    // Format the number for WhatsApp - ensure it starts with whatsapp:+ and remove any existing + prefix
    const whatsappNumber = `whatsapp:+${to.replace(/^\+/, '')}`;
    console.log('Formatted WhatsApp number:', whatsappNumber);

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error('Twilio WhatsApp number not configured')
    }

    console.log('Attempting to send WhatsApp message:', {
      to: whatsappNumber,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      body: message
    });

    const result = await client.messages.create({
      body: message,
      to: whatsappNumber,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
    }).catch(error => {
      console.error('Detailed Twilio error:', {
        code: error.code,
        message: error.message,
        moreInfo: error.moreInfo
      });
      throw new Error(`Twilio error: ${error.message}`);
    })

    console.log(`WhatsApp message sent with SID: ${result.sid}`)

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send WhatsApp message'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}