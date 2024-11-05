'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"

export function SendWhatsAppButton({ leadId, phoneNumber }: { leadId: string, phoneNumber: string }) {
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendWhatsApp = async () => {
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: `New lead update for lead ID: ${leadId}. Please check the system for details.`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send WhatsApp message')
      }

      // Handle success (e.g., show a success message)
      console.log('WhatsApp sent successfully:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      <Button onClick={handleSendWhatsApp} disabled={isSending}>
        {isSending ? 'Sending...' : 'Send WhatsApp'}
      </Button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}