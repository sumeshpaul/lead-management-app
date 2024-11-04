'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle } from 'lucide-react'

export function AddNewLead() {
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [newLead, setNewLead] = useState({
    title: '',
    division: '',
    status: 'New',
    assignedTo: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewLead({ ...newLead, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setNewLead({ ...newLead, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your API
    console.log('New lead:', newLead)
    // Reset form and hide it
    setNewLead({ title: '', division: '', status: 'New', assignedTo: '' })
    setIsFormVisible(false)
  }

  return (
    <div>
      <Button onClick={() => setIsFormVisible(!isFormVisible)}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add New Lead
      </Button>
      {isFormVisible && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            name="title"
            value={newLead.title}
            onChange={handleInputChange}
            placeholder="Lead Title"
            required
          />
          <Select
            value={newLead.division}
            onValueChange={(value) => handleSelectChange('division', value)}
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
          <Input
            name="assignedTo"
            value={newLead.assignedTo}
            onChange={handleInputChange}
            placeholder="Assigned To"
            required
          />
          <Button type="submit">Save New Lead</Button>
        </form>
      )}
    </div>
  )
}