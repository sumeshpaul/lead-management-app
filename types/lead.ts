export type Division = 'Real Estate Consulting' | 'Management Consulting' | 'Trading' | 'Real Estate Brokerage' | 'M&A and Private Equity'

export type LeadStatus = 'New' | 'In Progress' | 'Closed' | 'Terminated'

export interface Lead {
  id: string
  title: string
  division: Division
  status: LeadStatus
  assignedTo: string
  createdAt: string
  updatedAt: string
  comments: Comment[]
  followUps: FollowUp[]
  activities: Activity[]
}

export interface Comment {
  id: string
  leadId: string
  text: string
  author: string
  createdAt: string
}

export interface FollowUp {
  id: string
  leadId: string
  description: string
  scheduledDate: string
  scheduledTime: string
  createdAt: string
}

export interface Activity {
  id: string
  leadId: string
  description: string
  author: string
  timestamp: string
}