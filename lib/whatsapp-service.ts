interface WhatsAppRecipient {
  name: string
  phone: string
}

const TEAM_CONTACTS: Record<string, WhatsAppRecipient> = {
  "Dr. Amit": {
    name: "Dr. Amit",
    phone: "+971543323218"
  },
  "Mr. Prabhu": {
    name: "Mr. Prabhu",
    phone: "+971543323218"
  },
  "Mr. Sumesh Paul": {
    name: "Mr. Sumesh Paul",
    phone: "+971543323218"
  }
}

export async function sendWhatsApp(assignedTo: string, leadTitle: string): Promise<{ success: boolean; error?: string }> {
  try {
    const recipient = TEAM_CONTACTS[assignedTo]
    if (!recipient) {
      return {
        success: false,
        error: `No contact information found for ${assignedTo}`
      }
    }

    const message = `New lead assigned: "${leadTitle}" has been assigned to you. Please check the dashboard for details.`
    console.log('Sending WhatsApp notification to:', recipient.phone);
    console.log('Message:', message);

    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipient.phone,
        message: message
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send WhatsApp message')
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
    }
  }
}