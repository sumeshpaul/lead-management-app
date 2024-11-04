import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit2, MessageSquare, Clock } from 'lucide-react'
import { Lead, LeadStatus, Comment, Activity, Division } from '@/types/lead'

interface LeadDetailsProps {
  lead: Lead
  onUpdateLead: (updatedLead: Lead) => void
  onAddComment: (leadId: string, comment: string) => void
  userPhoneNumber: string
}

export default function LeadDetails({ lead, onUpdateLead, onAddComment, userPhoneNumber }: LeadDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedLead, setEditedLead] = useState<Lead>(lead)
  const [newComment, setNewComment] = useState('')

  const handleEditClick = () => {
    setIsEditing(true)
    setEditedLead(lead)
  }

  const handleSaveEdit = () => {
    onUpdateLead(editedLead)
    setIsEditing(false)
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddComment(lead.id, newComment)
      setNewComment('')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{lead.title}</CardTitle>
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
                  {['New', 'In Progress', 'Closed', 'Terminated'].map((status) => (
                    <Badge
                      key={status}
                      variant={lead.status === status ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const updatedLead = { ...lead, status: status as LeadStatus }
                        onUpdateLead(updatedLead)
                      }}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Division</h3>
                {isEditing ? (
                  <Select
                    value={editedLead.division}
                    onValueChange={(value: Division) => 
                      setEditedLead(prev => ({ ...prev, division: value }))
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
                  <p>{lead.division}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Assigned To</h3>
                {isEditing ? (
                  <Select
                    value={editedLead.assignedTo}
                    onValueChange={(value: string) => 
                      setEditedLead(prev => ({ ...prev, assignedTo: value }))
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
                  <p>{lead.assignedTo}</p>
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
                <Button onClick={handleAddComment}>Add Comment</Button>
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