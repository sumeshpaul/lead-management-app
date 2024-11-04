export type Division = 'Real Estate Consulting' | 'Management Consulting' | 'Trading' | 'Real Estate Brokerage' | 'M&A and Private Equity'
export type LeadStatus = 'New' | 'In Progress' | 'Closed' | 'Terminated'

export interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
}

export interface Activity {
  id: string
  description: string
  author: string
  timestamp: string
}

export interface Lead {
  id: string
  title: string
  division: Division
  status: LeadStatus
  assignedTo: string
  lastUpdated: string
  comments: Comment[]
  activities: Activity[]
}