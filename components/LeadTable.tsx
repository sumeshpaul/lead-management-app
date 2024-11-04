import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Lead } from "@/app/page"

interface LeadTableProps {
  leads: Lead[]
  onSelectLead: (lead: Lead) => void
}

export default function LeadTable({ leads, onSelectLead }: LeadTableProps) {
  return (
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
          <TableRow key={lead.id} onClick={() => onSelectLead(lead)} className="cursor-pointer hover:bg-muted">
            <TableCell className="font-medium">{lead.title}</TableCell>
            <TableCell>{lead.division}</TableCell>
            <TableCell>{lead.status}</TableCell>
            <TableCell>{lead.assignedTo}</TableCell>
            <TableCell>{lead.lastUpdated}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}