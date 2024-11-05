import { sql } from '@vercel/postgres';
import { notFound } from 'next/navigation';
import { FollowUpForm } from '@/components/FollowUpForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LeadDetailsPage({ params }: { params: { id: string } }) {
  const { rows: leadRows } = await sql`SELECT * FROM leads WHERE id = ${params.id}`;

  if (leadRows.length === 0) {
    notFound();
  }

  const lead = leadRows[0];

  const { rows: followUpsRows } = await sql`
    SELECT * FROM follow_ups 
    WHERE lead_id = ${params.id} 
    ORDER BY scheduled_date ASC, scheduled_time ASC
  `;

  const { rows: commentsRows } = await sql`
    SELECT * FROM comments 
    WHERE lead_id = ${params.id} 
    ORDER BY created_at DESC
  `;

  const { rows: activitiesRows } = await sql`
    SELECT * FROM activities 
    WHERE lead_id = ${params.id} 
    ORDER BY created_at DESC
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{lead.title}</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lead Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Division:</strong> {lead.division}</p>
          <p><strong>Status:</strong> {lead.status}</p>
          <p><strong>Assigned To:</strong> {lead.assigned_to}</p>
          <p><strong>Created At:</strong> {new Date(lead.created_at).toLocaleString()}</p>
          <p><strong>Updated At:</strong> {new Date(lead.updated_at).toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {commentsRows.length > 0 ? (
            <ul className="space-y-4">
              {commentsRows.map((comment) => (
                <li key={comment.id} className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString()} by {comment.author}
                  </p>
                  <p className="mt-1">{comment.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No comments yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesRows.length > 0 ? (
            <ul className="space-y-4">
              {activitiesRows.map((activity) => (
                <li key={activity.id} className="border-b pb-4">
                  <p className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()} by {activity.author}
                  </p>
                  <p className="mt-1">{activity.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No activities recorded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups</CardTitle>
        </CardHeader>
        <CardContent>
          <FollowUpForm leadId={params.id} />
          {followUpsRows.length > 0 && (
            <ul className="space-y-4 mt-6">
              {followUpsRows.map((followUp) => (
                <li key={followUp.id} className="border-b pb-4">
                  <p className="font-medium">
                    {new Date(followUp.scheduled_date).toLocaleDateString()} at {followUp.scheduled_time}
                  </p>
                  <p className="mt-1">{followUp.description}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}