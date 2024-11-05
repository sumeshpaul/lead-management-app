import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

interface Lead {
  id: string;
  title: string;
  division: string;
  status: string;
  assignedTo: string;
  created_at: string;
  updated_at: string;
  followUps: any[];
  comments: any[];
  activities: Activity[];
}

interface Activity {
  id: string;
  description: string;
  author: string;
  created_at: string;
}

async function sendWhatsAppNotification(phoneNumber: string, leadTitle: string) {
  try {
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: `New lead created: ${leadTitle}. Please check the system for details.`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp notification');
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
  }
}

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const client = await sql.connect();
  
  try {
    const { rows } = await client.query(`
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
    `);

    const leads: Lead[] = await Promise.all(rows.map(async (lead) => {
      const [followUps, comments, activities] = await Promise.all([
        client.query('SELECT * FROM follow_ups WHERE lead_id = $1', [lead.id]),
        client.query('SELECT * FROM comments WHERE lead_id = $1', [lead.id]),
        client.query('SELECT * FROM activities WHERE lead_id = $1', [lead.id])
      ]);

      return {
        ...lead,
        followUps: followUps.rows,
        comments: comments.rows,
        activities: activities.rows
      };
    }));

    return NextResponse.json({ leads });
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
  const token = request.headers.get('Authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const client = await sql.connect();
  
  try {
    await client.query('BEGIN');

    const { title, division, assignedTo } = await request.json();

    // Validation and sanitization
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

    // Insert the lead
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

    // Add initial activity
    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [rows[0].id, 'Lead created', sanitizedAssignedTo]);

    await client.query('COMMIT');

    // Send WhatsApp notification
    await sendWhatsAppNotification('+971543323218', sanitizedTitle);

    const lead: Lead = {
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