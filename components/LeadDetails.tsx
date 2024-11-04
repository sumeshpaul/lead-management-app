'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, MessageSquare, Clock } from 'lucide-react'
import { Lead, LeadStatus, Comment, Activity, Division } from '@/app/page'

interface LeadDetailsProps {
  lead: Lead
  onUpdateLead: (lead: Lead) => Promise<void>
  currentUser: string
}

export default function LeadDetails({ lead, onUpdateLead, currentUser }: LeadDetailsProps) {
  const [newComment, setNewComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Lead>(lead)

  const addActivity = (description: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      description,
      author: currentUser,
      timestamp: new Date().toLocaleString()
    }
    
    onUpdateLead({
      ...lead,
      activities: [newActivity, ...lead.activities],
      lastUpdated: new Date().toISOString().split('T')[0]
    })
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: currentUser,
      timestamp: new Date().toLocaleString()
    }

    addActivity(`Added a comment: "${newComment.trim()}"`)
    
    onUpdateLead({
      ...lead,
      comments: [...lead.comments, comment],
      lastUpdated: new Date().toISOString().split('T')[0]
    })

    setNewComment('')
  }

  const handleStatusChange = (newStatus: LeadStatus) => {
    addActivity(`Updated status to: ${newStatus}`)
    
    onUpdateLead({
      ...lead,
      status: newStatus,
      lastUpdated: new Date().toISOString().split('T')[0]
    })
  }

  const handleSaveEdit = () => {
    const changes: string[] = []
    if (editedLead.title !== lead.title) changes.push(`Title changed to "${editedLead.title}"`)
    if (editedLead.division !== lead.division) changes.push(`Division changed to "${editedLead.division}"`)
    if (editedLead.assignedTo !== lead.assignedTo) changes.push(`Assigned to changed to "${editedLead.assignedTo}"`)

    if (changes.length > 0) {
      const activityDescription = `Edited lead: ${changes.join(', ')}`
      addActivity(activityDescription)
    }

    onUpdateLead({
      ...editedLead,
      lastUpdated: new Date().toISOString().split('T')[0]
    })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{lead.title}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
          <Edit2 className="mr-2 h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit'}
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
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={editedLead.title}
                    onChange={(e) => setEditedLead({ ...editedLead, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Division</label>
                  <Select
                    value={editedLead.division}
                    onValueChange={(value: Division) => setEditedLead({ ...editedLead, division: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <Input
                    value={editedLead.assignedTo}
                    onChange={(e) => setEditedLead({ ...editedLead, assignedTo: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <div className="flex gap-2">
                    {['New', 'In Progress', 'Closed', 'Terminated'].map((status) => (
                      <Badge
                        key={status}
                        variant={lead.status === status ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleStatusChange(status as LeadStatus)}
                      >
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Division</h3>
                  <p>{lead.division}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Assigned To</h3>
                  <p>{lead.assignedTo}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Last Updated</h3>
                  <p>{new Date(lead.lastUpdated).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-4">
              {lead.comments.map((comment) => (
                <div key={comment.id} className="bg-muted p-4 rounded-lg">
                  <p className="mb-2">{comment.text}</p>
                  <p className="text-sm text-muted-foreground">
                    {comment.author} - {comment.timestamp}
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
                  Add Comment
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="border-l-2 border-primary pl-4">
                  <p>{activity.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.author} - {activity.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}