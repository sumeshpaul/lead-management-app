interface SMSRecipient {
    name: string
    phone: string
  }
  
  const TEAM_CONTACTS: Record<string, SMSRecipient> = {
    "Dr. Amit": {
      name: "Dr. Amit",
      phone: "+971501234567" // Replace with actual UAE number
    },
    "Mr. Prabhu": {
      name: "Mr. Prabhu",
      phone: "+971502345678" // Replace with actual UAE number
    },
    "Mr. Sumesh Paul": {
      name: "Mr. Sumesh Paul",
      phone: "+971503456789" // Replace with actual UAE number
    }
  }
  
  export async function sendSMS(assignedTo: string, leadTitle: string): Promise<boolean> {
    try {
      const recipient = TEAM_CONTACTS[assignedTo]
      if (!recipient) {
        console.error(`No contact information found for ${assignedTo}`)
        return false
      }
  
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient.phone,
          message: `New lead assigned: "${leadTitle}" has been assigned to you. Please check the dashboard for details.`
        }),
      })
  
      if (!response.ok) {
        throw new Error('Failed to send SMS')
      }
  
      return true
    } catch (error) {
      console.error('Error sending SMS:', error)
      return false
    }
  }