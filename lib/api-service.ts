import { Lead } from '@/types/lead'

export const apiService = {
  getLeads: async (page: number, token: string) => {
    const response = await fetch(`/api/leads?page=${page}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch leads')
    }
    return response.json()
  },

  addLead: async (lead: Lead, token: string) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(lead)
    })
    if (!response.ok) {
      throw new Error('Failed to add lead')
    }
    return response.json()
  },

  updateLead: async (lead: Lead, token: string) => {
    const response = await fetch(`/api/leads/${lead.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(lead)
    })
    if (!response.ok) {
      throw new Error('Failed to update lead')
    }
    return response.json()
  },

  deleteLead: async (id: string, token: string) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to delete lead')
    }
    return response.json()
  },

  getComments: async (leadId: string, token: string) => {
    const response = await fetch(`/api/leads/${leadId}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    return response.json()
  },

  addComment: async (leadId: string, comment: { text: string, author: string }, token: string) => {
    const response = await fetch(`/api/leads/${leadId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(comment)
    })
    if (!response.ok) {
      throw new Error('Failed to add comment')
    }
    return response.json()
  },

  getFollowUps: async (leadId: string, token: string) => {
    const response = await fetch(`/api/leads/${leadId}/followups`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch follow-ups')
    }
    return response.json()
  },

  addFollowUp: async (leadId: string, followUp: { description: string, scheduledDate: string, scheduledTime: string }, token: string) => {
    const response = await fetch(`/api/leads/${leadId}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(followUp)
    })
    if (!response.ok) {
      throw new Error('Failed to add follow-up')
    }
    return response.json()
  }
}