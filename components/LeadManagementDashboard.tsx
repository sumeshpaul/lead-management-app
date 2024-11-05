'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { PlusCircle, Edit2, MessageSquare, Clock, Calendar as CalendarIcon, Send, Trash2 } from 'lucide-react'
import { useToast } from "./ui/use-toast"
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { sendWhatsApp } from '@/lib/whatsapp-service'
import { Lead, Division, LeadStatus, Comment, Activity, FollowUp } from '@/types/lead'
import { apiService } from '@/lib/api-service'
import { logError } from '@/lib/logger'
import { refreshToken, isTokenExpired } from '@/lib/tokenRefresh'

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

interface LeadManagementDashboardProps {
  userPhoneNumber: string
  userName: string
  onLogout: () => void
}

export default function LeadManagementDashboard({ userPhoneNumber, userName, onLogout }: LeadManagementDashboardProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    description: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
  })
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { toast } = useToast()

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const data = await apiService.getLeads(page, token)
      setLeads(data.leads)
      setTotalPages(data.totalPages)
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'fetchLeads' })
      setError(error instanceof Error ? error.message : 'Failed to fetch leads')
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch leads',
      })
    } finally {
      setIsLoading(false)
    }
  }, [page, toast])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleSelectLead = async (lead: Lead) => {
    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const [commentsData, followUpsData] = await Promise.all([
        apiService.getComments(lead.id, token),
        apiService.getFollowUps(lead.id, token)
      ])
      setSelectedLead({
        ...lead,
        comments: commentsData.comments,
        followUps: followUpsData.followUps
      })
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleSelectLead', leadId: lead.id })
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to fetch lead details',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLead = async () => {
    if (!newLead.title?.trim() || !newLead.division || !newLead.assignedTo?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const data = await apiService.addLead(newLead as Lead, token)
      setLeads([data.lead, ...leads])
      setNewLead({
        title: '',
        division: undefined,
        status: 'New',
        assignedTo: '',
      })
      setIsAddLeadOpen(false)

      toast({
        title: "Success",
        description: `${data.lead.title} has been assigned to ${data.lead.assignedTo}.`,
      })

      const assignedUserPhone = getUserPhoneNumber(data.lead.assignedTo)
      if (assignedUserPhone) {
        try {
          await sendWhatsApp(
            assignedUserPhone,
            `New lead assigned: ${data.lead.title} (${data.lead.division}). Status: ${data.lead.status}`
          )
        } catch (error) {
          logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddLead', leadId: data.lead.id })
        }
      }
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddLead' })
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create lead',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const data = await apiService.updateLead(updatedLead, token)
      const updatedLeads = leads.map(lead => 
        lead.id === data.lead.id ? data.lead : lead
      )
      setLeads(updatedLeads)
      setSelectedLead(data.lead)

      toast({
        title: "Lead  Updated Successfully",
        description: `${data.lead.title} has been updated.`,
      })

      const assignedUserPhone = getUserPhoneNumber(data.lead.assignedTo)
      if (assignedUserPhone) {
        try {
          await sendWhatsApp(
            assignedUserPhone,
            `Lead updated: ${data.lead.title} (${data.lead.division}). New status: ${data.lead.status}`
          )
        } catch (error) {
          logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleUpdateLead', leadId: data.lead.id })
        }
      }
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleUpdateLead', leadId: updatedLead.id })
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update lead',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return
    }

    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      await apiService.deleteLead(id, token)
      setLeads(leads.filter(lead => lead.id !== id))
      setSelectedLead(null)
      toast({
        title: "Lead Deleted Successfully",
        description: "The lead has been removed from the system.",
      })
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleDeleteLead', leadId: id })
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete lead',
      })
    } finally {
      setIsLoading(false)
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

    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const data = await apiService.addComment(selectedLead.id, {
        text: newComment,
        author: userPhoneNumber,
      }, token)

      const updatedLead = {
        ...selectedLead,
        comments: [...selectedLead.comments, data.comment],
        activities: [...selectedLead.activities, {
          id: Date.now().toString(),
          leadId: selectedLead.id,
          description: `Added a comment: ${newComment.substring(0, 50)}...`,
          author: userPhoneNumber,
          timestamp: new Date().toISOString(),
        }],
      }

      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      ))
      setSelectedLead(updatedLead)
      setNewComment('')

      toast({
        title: "Comment Added Successfully",
        description: `Comment added to ${selectedLead.title}.`,
      })

      const assignedUserPhone = getUserPhoneNumber(selectedLead.assignedTo)
      if (assignedUserPhone) {
        try {
          await sendWhatsApp(
            assignedUserPhone,
            `New comment on lead "${selectedLead.title}": ${newComment.substring(0, 100)}${newComment.length > 100 ? '...' : ''}`
          )
        } catch (error) {
          logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddComment', leadId: selectedLead.id })
        }
      }
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddComment', leadId: selectedLead.id })
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add comment',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFollowUp = async () => {
    if (!selectedLead || !newFollowUp.description || !newFollowUp.scheduledDate || !newFollowUp.scheduledTime) return

    try {
      setIsLoading(true)
      let token = localStorage.getItem('token')

      if (!token || isTokenExpired(token)) {
        token = await refreshToken()
      }

      const data = await apiService.addFollowUp(selectedLead.id, {
        description: newFollowUp.description,
        scheduledDate: newFollowUp.scheduledDate,
        scheduledTime: newFollowUp.scheduledTime,
      }, token)

      const updatedLead = {
        ...selectedLead,
        followUps: [...selectedLead.followUps, data.followUp],
        activities: [...selectedLead.activities, {
          id: Date.now().toString(),
          leadId: selectedLead.id,
          description: `Scheduled a follow-up: ${newFollowUp.description.substring(0, 50)}...`,
          author: userPhoneNumber,
          timestamp: new Date().toISOString(),
        }],
      }

      setLeads(prevLeads => prevLeads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      ))
      setSelectedLead(updatedLead)
      setNewFollowUp({ 
        description: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
      })

      toast({
        title: "Follow-up Added",
        description: `Follow-up scheduled for ${format(parseISO(data.followUp.scheduledDate), 'PPP')} at ${data.followUp.scheduledTime}.`,
      })

      const assignedUserPhone = getUserPhoneNumber(selectedLead.assignedTo)
      if (assignedUserPhone) {
        try {
          await sendWhatsApp(
            assignedUserPhone,
            `New follow-up scheduled for lead "${selectedLead.title}" on ${format(parseISO(data.followUp.scheduledDate), 'PPP')} at ${data.followUp.scheduledTime}`
          )
        } catch (error) {
          logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddFollowUp', leadId: selectedLead.id })
        }
      }
    } catch (error) {
      logError(error as Error, { componentName: 'LeadManagementDashboard', operation: 'handleAddFollowUp', leadId: selectedLead.id })
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add follow-up',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Lead Management Dashboard</h1>
          <div className="flex items-center gap-4">
            <span>Logged in as: {userName} ({userPhoneNumber})</span>
            <Button variant="outline" onClick={onLogout}>Logout</Button>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchLeads} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Lead Management Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Logged in as: {userName} ({userPhoneNumber})</span>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </div>
      </div>
      
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsAddLeadOpen(true)}>
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.title}</TableCell>
                  <TableCell>{lead.division}</TableCell>
                  <TableCell>{lead.status}</TableCell>
                  <TableCell>{lead.assignedTo}</TableCell>
                  <TableCell>{format(parseISO(lead.updatedAt), 'PPP')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleSelectLead(lead)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-4">
            <Button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>Page {page} of {totalPages}</span>
            <Button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
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
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="comments">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comments
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                      <Clock className="h-4 w-4 mr-2" />
                      Activity
                    </TabsTrigger>
                    <TabsTrigger value="followups">
                      <CalendarIcon className="h-4 w-4 mr-2" />
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
                                      variant: "destructive",
                                      title: "Permission Denie d",
                                      description: "Only the assigned user can close or terminate this lead",
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
                            {formatUserDisplay(comment.author)} - {format(parseISO(comment.createdAt), 'PPP')}
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
                            {formatUserDisplay(activity.author)} - {format(parseISO(activity.timestamp), 'PPP')}
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
                            Scheduled for: {format(parseISO(followUp.scheduledDate), 'PPP')} at {followUp.scheduledTime}
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
                                !newFollowUp.scheduledDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {newFollowUp.scheduledDate ? format(parseISO(newFollowUp.scheduledDate), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newFollowUp.scheduledDate ? parseISO(newFollowUp.scheduledDate) : undefined}
                              onSelect={(date) => setNewFollowUp(prev => ({ ...prev, scheduledDate: date ? date.toISOString().split('T')[0] : '' }))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          value={newFollowUp.scheduledTime}
                          onChange={(e) => setNewFollowUp(prev => ({ ...prev, scheduledTime: e.target.value }))}
                        />
                        <Textarea 
                          placeholder="Follow-up description..." 
                          value={newFollowUp.description}
                          onChange={(e) => setNewFollowUp(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <Button onClick={handleAddFollowUp}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a lead to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}