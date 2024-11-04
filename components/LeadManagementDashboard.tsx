'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PlusCircle, Edit2, MessageSquare, Clock } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { sendWhatsApp } from '@/lib/whatsapp-service'

const USER_MAPPING: Record<string, string> = {
  '+971543323218': 'Dr. (CA) Amit Garg',
  '+971543323219': 'Mr. Prabhakaran',
  '+971543323220': 'Mr. Sumesh Paul',
}

const canUpdateStatus = (lead: Lead, userPhone: string, newStatus: LeadStatus) => {
  const assignedUserPhone = Object.entries(USER_MAPPING).find(
    ([phone, name]) => name === lead.assignedTo
  )?.[0]
  
  if (newStatus === 'Closed' || newStatus === 'Terminated') {
    return assignedUserPhone === userPhone
  }
  return true
}

const formatUserDisplay = (phoneNumber: string) => {
  return USER_MAPPING[phoneNumber] || phoneNumber
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

interface LeadManagementDashboardProps {
  userPhoneNumber: string
}

export default function LeadManagementDashboard({ userPhoneNumber }: LeadManagementDashboardProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      title: 'Warehouse Solutions Project',
      division: 'Real Estate Consulting',
      status: 'In Progress',
      assignedTo: 'Dr. Amit',
      lastUpdated: '2024-01-04',
      comments: [],
      activities: [],
    },
    {
      id: '2',
      title: 'Corporate Tax Advisory',
      division: 'Management Consulting',
      status: 'New',
      assignedTo: 'Mr. Prabhu',
      lastUpdated: '2024-01-05',
      comments: [],
      activities: [],
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
    },
    {
      id: '4',
      title: 'Commercial Property Listing',
      division: 'Real Estate Brokerage',
      status: 'New',
      assignedTo: 'Dr. Amit',
      lastUpdated: '2024-01-07',
      comments: [],
      activities: [],
    },
    {
      id: '5',
      title: 'Tech Startup Acquisition',
      division: 'M&A and Private Equity',
      status: 'In Progress',
      assignedTo: 'Mr. Prabhu',
      lastUpdated: '2024-01-08',
      comments: [],
      activities: [],
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

  const { toast } = useToast()

  const formatTimestamp = () => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
        description: `Lead created by ${userPhoneNumber}`,
        author: userPhoneNumber,
        timestamp
      }],
    }

    setLeads([...leads, lead])
    setNewLead({
      title: '',
      division: undefined,
      status: 'New',
      assignedTo: '',
    })

    // Send WhatsApp notification
    const message = `New lead assigned: "${lead.title}" has been assigned to you. Please check the dashboard for details.`
    const result = await sendWhatsApp(lead.assignedTo, message)

    toast({
      title: result.success ? "Lead Added Successfully" : "Lead Addition Warning",
      description: result.success 
        ? `${lead.title} has been assigned to ${lead.assignedTo}`
        : `Lead added but ${result.error || 'failed to send WhatsApp notification'}`,
      variant: result.success ? "default" : "destructive",
    })
  }

  const handleUpdateLead = async (updatedLead: Lead) => {
    const timestamp = formatTimestamp()
    const activity: Activity = {
      id: Date.now().toString(),
      description: `Lead updated by ${userPhoneNumber}`,
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

    if (updatedLead.assignedTo !== selectedLead?.assignedTo) {
      const message = `Lead "${updatedLead.title}" has been reassigned to you.`
      const result = await sendWhatsApp(updatedLead.assignedTo, message)

      toast({
        title: result.success ? "Lead Reassigned Successfully" : "Lead Reassignment Warning",
        description: result.success 
          ? `${updatedLead.title} has been reassigned to ${updatedLead.assignedTo}`
          : `Lead reassigned but ${result.error || 'failed to send WhatsApp notification'}`,
        variant: result.success ? "default" : "destructive",
      })
    } else {
      toast({
        title: "Lead Updated Successfully",
        description: `${updatedLead.title} has been updated`,
      })
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedLead(selectedLead)
  }

  const handleSaveEdit = async () => {
    if (editedLead) {
      await handleUpdateLead(editedLead)
      setIsEditing(false)
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

    const updatedLead = {
      ...selectedLead,
      comments: [...selectedLead.comments, comment],
      lastUpdated: new Date().toISOString().split('T')[0]
    }

    const updatedLeads = leads.map(lead => 
      lead.id === updatedLead.id ? updatedLead : lead
    )
    setLeads(updatedLeads)
    setSelectedLead(updatedLead)
    setNewComment('')

    // Send WhatsApp notification to assigned user
    const message = `New comment on lead "${selectedLead.title}": ${newComment}`
    const result = await sendWhatsApp(selectedLead.assignedTo, message)

    toast({
      title: result.success ? "Comment Added Successfully" : "Comment Addition Warning",
      description: result.success 
        ? `Comment added to ${selectedLead.title}`
        : `Comment added but ${result.error || 'failed to send WhatsApp notification'}`,
      variant: result.success ? "default" : "destructive",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Management Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Logged in as: {formatUserDisplay(userPhoneNumber)}</span>
          <Button variant="outline" onClick={() => {/* Implement logout logic */}}>Logout</Button>
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
                  <SelectItem value="Dr. Amit">Dr. Amit</SelectItem>
                  <SelectItem value="Mr. Prabhu">Mr. Prabhu</SelectItem>
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
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="comments" className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Comments
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Activity
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
                              <SelectItem value="Dr. Amit">Dr. Amit</SelectItem>
                              <SelectItem value="Mr. Prabhu">Mr. Prabhu</SelectItem>
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
                        <Button onClick={handleAddComment}>Add Comment</Button>
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