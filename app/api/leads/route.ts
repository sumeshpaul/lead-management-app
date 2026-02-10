import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/lib/auth';
import { sendWhatsAppVerification } from '@/lib/twilio-service';

export async function GET(request: Request) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const offset = (page - 1) * limit;

  const client = await sql.connect();

  try {
    // Get total count for pagination
    const countResult = await client.query('SELECT COUNT(*) as total FROM leads');
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get paginated leads
    const { rows: leads } = await client.query(`
      SELECT
        id,
        title,
        division,
        status,
        assigned_to as "assignedTo",
        created_at,
        updated_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    if (leads.length === 0) {
      return NextResponse.json({ leads: [], totalPages, page });
    }

    // Batch fetch related data to avoid N+1 queries
    const leadIds = leads.map(l => l.id);
    const placeholders = leadIds.map((_, i) => `$${i + 1}`).join(',');

    const [followUpsResult, commentsResult, activitiesResult] = await Promise.all([
      client.query(`SELECT * FROM follow_ups WHERE lead_id IN (${placeholders})`, leadIds),
      client.query(`SELECT * FROM comments WHERE lead_id IN (${placeholders})`, leadIds),
      client.query(`SELECT * FROM activities WHERE lead_id IN (${placeholders})`, leadIds),
    ]);

    // Group by lead_id
    const followUpsByLead = groupBy(followUpsResult.rows, 'lead_id');
    const commentsByLead = groupBy(commentsResult.rows, 'lead_id');
    const activitiesByLead = groupBy(activitiesResult.rows, 'lead_id');

    const enrichedLeads = leads.map(lead => ({
      ...lead,
      followUps: followUpsByLead[lead.id] || [],
      comments: commentsByLead[lead.id] || [],
      activities: activitiesByLead[lead.id] || [],
    }));

    return NextResponse.json({ leads: enrichedLeads, totalPages, page });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    const { title, division, assignedTo } = await request.json();

    if (typeof title !== 'string' || typeof division !== 'string' || typeof assignedTo !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input types' },
        { status: 400 }
      );
    }

    const sanitizedTitle = title.trim();
    const sanitizedDivision = division.trim();
    const sanitizedAssignedTo = assignedTo.trim();

    if (!sanitizedTitle || !sanitizedDivision || !sanitizedAssignedTo) {
      return NextResponse.json(
        { error: 'Title, division, and assignedTo are required' },
        { status: 400 }
      );
    }

    const { rows } = await client.query(`
      INSERT INTO leads (title, division, assigned_to, created_at, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING
        id,
        title,
        division,
        status,
        assigned_to as "assignedTo",
        created_at,
        updated_at
    `, [sanitizedTitle, sanitizedDivision, sanitizedAssignedTo]);

    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [rows[0].id, 'Lead created', sanitizedAssignedTo]);

    await client.query('COMMIT');

    // Send WhatsApp notification (non-blocking, don't fail if it errors)
    sendWhatsAppVerification(
      decoded.phoneNumber,
      `New lead created: ${sanitizedTitle}. Assigned to: ${sanitizedAssignedTo}.`
    ).catch(err => console.error('WhatsApp notification error:', err));

    const lead = {
      ...rows[0],
      followUps: [],
      comments: [],
      activities: [{
        id: rows[0].id,
        description: 'Lead created',
        author: sanitizedAssignedTo,
        created_at: new Date().toISOString()
      }]
    };

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

function groupBy<T extends Record<string, any>>(items: T[], key: string): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const val = item[key];
    if (!groups[val]) groups[val] = [];
    groups[val].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
