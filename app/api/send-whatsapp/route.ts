import { NextResponse } from 'next/server'
import twilio from 'twilio'

interface TwilioError extends Error {
  code: string;
  status: number;
}

export async function POST(request: Request) {
  // Debug logging for environment variables
  const envVars = {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.slice(0, 4) + '...',
    authToken: process.env.TWILIO_AUTH_TOKEN ? 'present' : 'missing',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER, // Changed from TWILIO_WHATSAPP_NUMBER
  }
  
  console.log('Environment variables state:', envVars)

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER // Changed from TWILIO_WHATSAPP_NUMBER

  // Validate environment variables
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    const missingVars = {
      accountSid: !accountSid,
      authToken: !authToken,
      phoneNumber: !twilioPhoneNumber,
    }
    console.error('Missing environment variables:', missingVars)
    return NextResponse.json(
      {
        success: false,
        error: 'WhatsApp service not configured properly',
        details: `Missing environment variables: ${Object.entries(missingVars)
          .filter(([_, missing]) => missing)
          .map(([name]) => name)
          .join(', ')}`,
      },
      { status: 500 }
    )
  }

  try {
    const { to, message } = await request.json()

    // Validate request body
    if (!to || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: 'Both "to" and "message" fields are required',
        },
        { status: 400 }
      )
    }

    // Format WhatsApp numbers
    const formatWhatsAppNumber = (number: string): string => {
      const cleaned = number.replace(/[^\d+]/g, '')
      return `whatsapp:${cleaned.startsWith('+') ? cleaned : `+${cleaned}`}`
    }

    const toNumber = formatWhatsAppNumber(to)
    const fromNumber = formatWhatsAppNumber(twilioPhoneNumber)

    console.log('Attempting to send WhatsApp message:', {
      to: toNumber,
      from: fromNumber,
      messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    })

    // Initialize Twilio client
    try {
      const client = twilio(accountSid, authToken)
      console.log('Twilio client initialized successfully')

      // Send message
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: toNumber,
      })

      console.log('WhatsApp message sent successfully:', {
        sid: result.sid,
        status: result.status,
      })

      return NextResponse.json({
        success: true,
        sid: result.sid,
        status: result.status,
      })
    } catch (error) {
      const twilioError = error as TwilioError;
      console.error('Twilio client error:', {
        name: twilioError.name,
        message: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
      })

      return NextResponse.json({
        success: false,
        error: 'Failed to send WhatsApp message',
        details: twilioError.message,
        code: twilioError.code,
        status: twilioError.status,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Request processing error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 })
  }
}