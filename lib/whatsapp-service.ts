export async function sendWhatsApp(to: string, message: string) {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      throw new Error(data.error || 'Failed to send WhatsApp message')
    }

    return { success: true, messageId: data.sid }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
    }
  }
}