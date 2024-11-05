'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { PlusCircle, Edit2, MessageSquare, Clock, Calendar as CalendarIcon, Send } from 'lucide-react'
import { useToast } from "./ui/use-toast"
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const USER_MAPPING: Record<string, { name: string; phone: string }> = {
  '+971506294302': { name: 'Dr. (CA) Amit Garg', phone: '+971506294302' },
  '+971543323219': { name: 'Mr. Prabhakaran', phone: '+971543323219' },
  '+971543323218': { name: 'Mr. Sumesh Paul', phone: '+971543323218' },
}

const getUserPhoneNumber = (name: string): string => {
  const user = Object.values(USER_MAPPING).find(u => u.name === name)
  return user?.phone || ''
}

const canUpdateStatus = (lead: Lead, userPhone: string, newStatus: LeadStatus) => {
  const assignedUserPhone = Object.entries(USER_MAPPING).find(
    ([_, user]) => user.name === lead.assignedTo
  )?.[0]

  if (newStatus === 'Closed' || newStatus === 'Terminated') {
    return assignedUserPhone === userPhone
  }
  return true
}

const formatUserDisplay = (phoneNumber: string) => {
  return USER_MAPPING[phoneNumber]?.name || phoneNumber
}

const sendWhatsAppMessages = async (message: string) => {
  const phoneNumbers = Object.values(USER_MAPPING).map(user => user.phone)
  const results = await Promise.all(phoneNumbers.map(async (to) => {
    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, message }),
      })

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message')
      }

      return await response.json()
    } catch (error) {
      console.error(`Error sending WhatsApp message to ${to}:`, error)
      return { error: true, to }
    }
  }))

  const failures = results.filter(result => result.error)
  if (failures.length > 0) {
    throw new Error(`Failed to send WhatsApp messages to ${failures.length} recipients`)
  }

  return results
}

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

export interface FollowUp {
  id: string
  date: Date
  time: string
  description: string
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
  followUps: FollowUp[]
}

interface LeadManagementDashboardProps {
  userPhoneNumber: string
  userName: string
  onLogout: () => void
}

export default function LeadManagementDashboard({ userPhoneNumber, userName, onLogout }: LeadManagementDashboardProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      title: 'Warehouse Solutions Project',
      division: 'Real Estate Consulting',
      status: 'In Progress',
      assignedTo: 'Dr. (CA) Amit Garg',
      lastUpdated: '2024-01-04',
      comments: [],
      activities: [],
      followUps: [],
    },
    {
      id: '2',
      title: 'Corporate Tax Advisory',
      division: 'Management Consulting',
      status: 'New',
      assignedTo: 'Mr. Prabhakaran',
      lastUpdated: '2024-01-05',
      comments: [],
      activities: [],
      followUps: [],
    },
    {
      id: '3',
      title: 'Petroleum Products Supply Chain',
      division: 'Trading',
      status: 'In Progress',
      assignedTo: 'Mr. Sumesh Paul',
      lastUpdated: '2024-01-06',
      comments: [],
      activities: [],
      followUps: [],
    },
    {
      id: '4',
      title: 'Commercial Property Listing',
      division: 'Real Estate Brokerage',
      status: 'New',
      assignedTo: 'Dr. (CA) Amit Garg',
      lastUpdated: '2024-01-07',
      comments: [],
      activities: [],
      followUps: [],
    },
    {
      id: '5',
      title: 'Tech Startup Acquisition',
      division: 'M&A and Private Equity',
      status: 'In Progress',
      assignedTo: 'Mr. Prabhakaran',
      lastUpdated: '2024-01-08',
      comments: [],
      activities: [],
      followUps: [],
    },
  ])

  const [newLead, setNewLead] = useState<Partial<Lead>>({
    title: '',
    division: undefined,
    status: 'New',
    assignedTo: '',
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Lead | null>(null)
  const [newComment, setNewComment] = useState('')
  const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUp>>({
    date: new Date(),
    time: '09:00',
    description: '',
  })

  const { toast } = useToast()

  const formatTimestamp = () => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Dubai'  // Set to UAE timezone
    }).format(new Date())
  }

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleAddLead = async () => {
    if (!newLead.title?.trim() || !newLead.division || !newLead.assignedTo?.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const timestamp = formatTimestamp()
    const lead: Lead = {
      id: (leads.length + 1).toString(),
      title: newLead.title,
      division: newLead.division,
      status: newLead.status as LeadStatus,
      assignedTo: newLead.assignedTo,
      lastUpdated: new Date().toISOString().split('T')[0],
      comments: [],
      activities: [{
        id: Date.now().toString(),
        description: `Lead created by ${formatUserDisplay(userPhoneNumber)}`,
        author: userPhoneNumber,
        timestamp
      }],
      followUps: [],
    }

    setLeads([...leads, lead])
    setNewLead({
      title: '',
      division: undefined,
      status: 'New',
      assignedTo: '',
    })

    const message = `New lead added: "${lead.title}" has been assigned to ${lead.assignedTo}. Please check the dashboard for details.`
    try {
      await sendWhatsAppMessages(message)
      toast({
        title: "Lead Added Successfully",
        description: `${lead.title} has been assigned to ${lead.assignedTo}. WhatsApp notifications sent to all team members.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Lead Added",
        description: `${lead.title} has been assigned to ${lead.assignedTo}, but some WhatsApp notifications failed.`,
        variant: "default",
      })
    }
  }

  const handleUpdateLead = async (updatedLead: Lead) => {
    const timestamp = formatTimestamp()
    const activity: Activity = {
      id: Date.now().toString(),
      description: `Lead updated by ${formatUserDisplay(userPhoneNumber)}`,
      author: userPhoneNumber,
      timestamp
    }

    const finalUpdatedLead = {
      ...updatedLead,
      activities: [...updatedLead.activities, activity],
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    const updatedLeads = leads.map(lead => 
      lead.id === finalUpdatedLead.id ? finalUpdatedLead : lead
    )
    setLeads(updatedLeads)
    setSelectedLead(finalUpdatedLead)

    const message = `Lead "${updatedLead.title}" has been updated by ${formatUserDisplay(userPhoneNumber)}.`
    try {
      await sendWhatsAppMessages(message)
      toast({
        title: "Lead Updated Successfully",
        description: `${updatedLead.title} has been updated. WhatsApp notifications sent to all team members.`,
      })
    } catch (error) {
      toast({
        title: "Lead Updated",
        description: `${updatedLead.title} has been updated, but some WhatsApp notifications failed.`,
      })
    }
  }

  const handleEditClick = () => {
    if (selectedLead) {
      setIsEditing(true)
      setEditedLead({...selectedLead})
    }
  }

  const handleSaveEdit = async () => {
    if (editedLead) {
      await handleUpdateLead(editedLead)
      setIsEditing(false)
      setEditedLead(null)
    }
  }

  const handleAddComment = async () => {
    if (!selectedLead || !newComment.trim()) return

    const timestamp = formatTimestamp()
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      author: userPhoneNumber,
      timestamp
    }

    const activity: Activity = {
      id: Date.now().toString(),
      description: `Comment added by ${formatUserDisplay(userPhoneNumber)}: "${newComment.substring(0, 50)}${newComment.length > 50 ? '...' : ''}"`,
      author: userPhoneNumber,
      timestamp
    }

    const updatedLead = {
      ...selectedLead,
      comments: [...selectedLead.comments, comment],
      activities: [...selectedLead.activities, activity],
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    const updatedLeads = leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    )
    setLeads(updatedLeads)
    
    setSelectedLead(updatedLead)
    setNewComment('')

    const message = `New comment on lead "${selectedLead.title}" by ${formatUserDisplay(userPhoneNumber)}: ${newComment}`
    try {
      await sendWhatsAppMessages(message)
      toast({
        title: "Comment Added Successfully",
        description: `Comment added to ${selectedLead.title}. WhatsApp notifications sent to all team members.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Comment Added",
        description: `Comment added to ${selectedLead.title}, but some WhatsApp notifications failed.`,
        variant: "default",
      })
    }
  }

  const handleAddFollowUp = async () => {
    if (!selectedLead || !newFollowUp.date || !newFollowUp.time || !newFollowUp.description) return

    const timestamp = formatTimestamp()
    const followUp: FollowUp = {
      id: Date.now().toString(),
      date: newFollowUp.date,
      time: newFollowUp.time,
      description: newFollowUp.description,
    }

    const activity: Activity = {
      id: Date.now().toString(),
      description: `Follow-up scheduled by ${formatUserDisplay(userPhoneNumber)} for ${format(followUp.date, 'PPP')} at ${followUp.time}`,
      author: userPhoneNumber,
      timestamp
    }

    const updatedLead = {
      ...selectedLead,
      followUps: [...selectedLead.followUps, followUp],
      activities: [...selectedLead.activities, activity],
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    const updatedLeads = leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    )
    setLeads(updatedLeads)
    setSelectedLead(updatedLead)
    setNewFollowUp({ date: new Date(), time: '09:00', description: '' })

    const message = `New follow-up for lead "${selectedLead.title}": ${followUp.description} scheduled for ${format(followUp.date, 'PPP')} at ${followUp.time}`
    try {
      await sendWhatsAppMessages(message)
      toast({
        title: "Follow-up Added",
        description: `Follow-up scheduled for ${format(followUp.date, 'PPP')} at ${followUp.time}. WhatsApp notifications sent to all team members.`,
      })
    } catch (error) {
      toast({
        title: "Follow-up Added",
        description: `Follow-up scheduled for ${format(followUp.date, 'PPP')} at ${followUp.time}, but some WhatsApp notifications failed.`,
      })
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl  font-bold">Lead Management Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Logged in as: {userName} ({userPhoneNumber})</span>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
      </div>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                placeholder="Lead Title"
                value={newLead.title}
                onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Select
                value={newLead.division}
                onValueChange={(value: Division) => setNewLead({ ...newLead, division: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Real Estate Consulting">Real Estate Consulting</SelectItem>
                  <SelectItem value="Management Consulting">Management Consulting</SelectItem>
                  <SelectItem value="Trading">Trading</SelectItem>
                  <SelectItem value="Real Estate Brokerage">Real Estate Brokerage</SelectItem>
                  <SelectItem value="M&A and Private Equity">M&A and Private Equity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Select
                value={newLead.assignedTo}
                onValueChange={(value: string) => setNewLead({ ...newLead, assignedTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr. (CA) Amit Garg">Dr. (CA) Amit Garg</SelectItem>
                  <SelectItem value="Mr. Prabhakaran">Mr. Prabhakaran</SelectItem>
                  <SelectItem value="Mr. Sumesh Paul">Mr. Sumesh Paul</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id} onClick={() => handleSelectLead(lead)} className="cursor-pointer hover:bg-muted">
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>{lead.division}</TableCell>
                  <TableCell>{lead.status}</TableCell>
                  <TableCell>{lead.assignedTo}</TableCell>
                  <TableCell>{lead.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div>
          {selectedLead ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{selectedLead.title}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="followups" className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Follow-ups
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Status</h3>
                        <div className="flex gap-2">
                          {['New', 'In Progress', 'Closed', 'Terminated'].map((status) => {
                            const canUpdate = canUpdateStatus(selectedLead, userPhoneNumber, status as LeadStatus)
                            return (
                              <Badge
                                key={status}
                                variant={selectedLead.status === status ? 'default' : 'outline'}
                                className={`cursor-pointer ${!canUpdate && 'opacity-50'}`}
                                onClick={() => {
                                  if (canUpdate) {
                                    const updatedLead = { ...selectedLead, status: status as LeadStatus }
                                    handleUpdateLead(updatedLead)
                                  } else {
                                    toast({
                                      title: "Permission Denied",
                                      description: "Only the assigned user can close or terminate this lead",
                                      variant: "destructive",
                                    })
                                  }
                                }}
                              >
                                {status}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Division</h3>
                        {isEditing ? (
                          <Select
                            value={editedLead?.division}
                            onValueChange={(value: Division) => 
                              setEditedLead(prev => prev ? { ...prev, division: value } : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Division" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Real Estate Consulting">Real Estate Consulting</SelectItem>
                              <SelectItem value="Management Consulting">Management Consulting</SelectItem>
                              <SelectItem value="Trading">Trading</SelectItem>
                              <SelectItem value="Real Estate Brokerage">Real Estate Brokerage</SelectItem>
                              <SelectItem value="M&A and Private Equity">M&A and Private Equity</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p>{selectedLead.division}</p>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Assigned To</h3>
                        {isEditing ? (
                          <Select
                            value={editedLead?.assignedTo}
                            onValueChange={(value: string) => 
                              setEditedLead(prev => prev ? { ...prev, assignedTo: value } : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign To" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dr. (CA) Amit Garg">Dr. (CA) Amit Garg</SelectItem>
                              <SelectItem value="Mr. Prabhakaran">Mr. Prabhakaran</SelectItem>
                              <SelectItem value="Mr. Sumesh Paul">Mr. Sumesh Paul</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p>{selectedLead.assignedTo}</p>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="space-y-4">
                    <div className="space-y-4">
                      {selectedLead.comments.map((comment) => (
                        <div key={comment.id} className="bg-muted p-4 rounded-lg">
                          <p className="mb-2">{comment.text}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatUserDisplay(comment.author)} - {comment.timestamp}
                          </p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Textarea 
                          placeholder="Add a comment..." 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button onClick={handleAddComment}>
                          <Send className="mr-2 h-4 w-4" />
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <div className="space-y-4">
                      {selectedLead.activities.map((activity) => (
                        <div key={activity.id} className="border-l-2 border-primary pl-4">
                          <p>{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatUserDisplay(activity.author)} - {activity.timestamp}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="followups" className="space-y-4">
                    <div className="space-y-4">
                      {selectedLead.followUps.map((followUp) => (
                        <div key={followUp.id} className="bg-muted p-4 rounded-lg">
                          <p className="mb-2">{followUp.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Scheduled for: {format(followUp.date, 'PPP')} at {followUp.time}
                          </p>
                        </div>
                      ))}
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !newFollowUp.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newFollowUp.date ? format(newFollowUp.date, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newFollowUp.date}
                              onSelect={(date: Date | undefined) => {
                                setNewFollowUp({ ...newFollowUp, date: date || new Date() })
                                const popoverElement = document.querySelector('[data-radix-popper-content-wrapper]')
                                if (popoverElement) {
                                  const closeEvent = new Event('closePopover')
                                  popoverElement.dispatchEvent(closeEvent)
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          value={newFollowUp.time}
                          onChange={(e) => setNewFollowUp({ ...newFollowUp, time: e.target.value })}
                          className="w-[280px]"
                        />
                        <Textarea 
                          placeholder="Follow-up description..." 
                          value={newFollowUp.description}
                          onChange={(e) => setNewFollowUp({ ...newFollowUp, description: e.target.value })}
                        />
                        <Button onClick={handleAddFollowUp}>
                          <Send className="mr-2 h-4 w-4" />
                          Add Follow-up
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              Select a lead to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}