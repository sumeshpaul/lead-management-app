import { NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER

// Validate environment variables
if (!accountSid || !authToken || !twilioWhatsAppNumber) {
  console.error('Missing required Twilio environment variables')
}

// Ensure WhatsApp number is properly formatted
const formatWhatsAppNumber = (number: string): string => {
  // Remove any existing 'whatsapp:' prefix
  const cleanNumber = number.replace('whatsapp:', '')
  // Ensure it starts with '+'
  return `whatsapp:${cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`}`
}

export async function POST(request: Request) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to or message' },
        { status: 400 }
      )
    }

    // Update the regex to accept numbers with or without + prefix
    const uaeNumberRegex = /^\+?971[0-9]{9}$/
    if (!uaeNumberRegex.test(to)) {
      console.error('Invalid phone number format:', to)
      return NextResponse.json(
        { success: false, error: `Invalid UAE mobile number format: ${to}` },
        { status: 400 }
      )
    }

    // Format the number for WhatsApp - ensure it starts with + and remove any existing + prefix
    const formattedToNumber = formatWhatsAppNumber(to)

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      console.error('Missing Twilio configuration')
      return NextResponse.json(
        { success: false, error: 'WhatsApp service not configured properly' },
        { status: 500 }
      )
    }

    const formattedFromNumber = formatWhatsAppNumber(twilioWhatsAppNumber)

    console.log('Sending WhatsApp message:', {
      to: formattedToNumber,
      from: formattedFromNumber,
      body: message
    })

    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      body: message,
      from: formattedFromNumber,
      to: formattedToNumber
    })

    console.log(`WhatsApp message sent with SID: ${result.sid}`)
    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error) {
    console.error('Error processing WhatsApp message request:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process WhatsApp message request'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}