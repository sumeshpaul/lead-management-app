import { NextResponse } from 'next/server'
import { verifyRequestAuth } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/twilio-service'

export async function POST(request: Request) {
  const decoded = verifyRequestAuth(request)
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Both "to" and "message" fields are required' },
        { status: 400 }
      )
    }

    const recipients = Array.isArray(to) ? to : [to]

    const results = await Promise.all(
      recipients.map(async (recipient: string) => {
        const result = await sendWhatsAppMessage(recipient, message)
        return { to: recipient, ...result }
      })
    )

    const successfulSends = results.filter(r => r.success)
    const failedSends = results.filter(r => !r.success)

    return NextResponse.json({
      success: failedSends.length === 0,
      totalSent: successfulSends.length,
      totalFailed: failedSends.length,
      results,
    })
  } catch (error) {
    console.error('Request processing error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}
