import { Lead } from '@/types/lead'

export class AuthError extends Error {
  constructor() {
    super('Authentication failed')
    this.name = 'AuthError'
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(url, options)

  if (response.status === 401) {
    // Try to refresh the token (cookie-based, automatic)
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
    })

    if (!refreshResponse.ok) {
      throw new AuthError()
    }

    // Retry the original request with the new cookie
    response = await fetch(url, options)

    if (response.status === 401) {
      throw new AuthError()
    }
  }

  return response
}

export const apiService = {
  getLeads: async (page: number) => {
    const response = await fetchWithAuth(`/api/leads?page=${page}&limit=10`)
    if (!response.ok) {
      throw new Error('Failed to fetch leads')
    }
    return response.json()
  },

  addLead: async (lead: Partial<Lead>) => {
    const response = await fetchWithAuth('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    })
    if (!response.ok) {
      throw new Error('Failed to add lead')
    }
    return response.json()
  },

  updateLead: async (lead: Lead) => {
    const response = await fetchWithAuth(`/api/leads/${lead.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    })
    if (!response.ok) {
      throw new Error('Failed to update lead')
    }
    return response.json()
  },

  deleteLead: async (id: string) => {
    const response = await fetchWithAuth(`/api/leads/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete lead')
    }
    return response.json()
  },

  getComments: async (leadId: string) => {
    const response = await fetchWithAuth(`/api/leads/${leadId}/comments`)
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    return response.json()
  },

  addComment: async (leadId: string, comment: { text: string, author: string }) => {
    const response = await fetchWithAuth(`/api/leads/${leadId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    })
    if (!response.ok) {
      throw new Error('Failed to add comment')
    }
    return response.json()
  },

  getFollowUps: async (leadId: string) => {
    const response = await fetchWithAuth(`/api/leads/${leadId}/followups`)
    if (!response.ok) {
      throw new Error('Failed to fetch follow-ups')
    }
    return response.json()
  },

  addFollowUp: async (leadId: string, followUp: { description: string, scheduledDate: string, scheduledTime: string }) => {
    const response = await fetchWithAuth(`/api/leads/${leadId}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUp)
    })
    if (!response.ok) {
      throw new Error('Failed to add follow-up')
    }
    return response.json()
  },

  sendWhatsApp: async (to: string, message: string) => {
    const response = await fetchWithAuth('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message })
    })
    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message')
    }
    return response.json()
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
  }
}
