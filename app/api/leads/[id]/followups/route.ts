import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

interface FollowUp {
  id: string;
  lead_id: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  created_at: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    const { rows } = await client.query<FollowUp>(`
      SELECT id, lead_id, description, scheduled_date, scheduled_time, created_at
      FROM follow_ups
      WHERE lead_id = $1
      ORDER BY scheduled_date ASC, scheduled_time ASC
    `, [params.id]);

    return NextResponse.json({ followUps: rows });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    await client.query('BEGIN');

    const { description, scheduledDate, scheduledTime, author } = await request.json();

    // Validation and sanitization
    if (typeof description !== 'string' || typeof scheduledDate !== 'string' || 
        typeof scheduledTime !== 'string' || typeof author !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input types' },
        { status: 400 }
      );
    }

    const sanitizedDescription = description.trim();
    const sanitizedScheduledDate = scheduledDate.trim();
    const sanitizedScheduledTime = scheduledTime.trim();
    const sanitizedAuthor = author.trim();

    if (!sanitizedDescription || !sanitizedScheduledDate || !sanitizedScheduledTime || !sanitizedAuthor) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Insert the follow-up
    const { rows } = await client.query<FollowUp>(`
      INSERT INTO follow_ups (lead_id, description, scheduled_date, scheduled_time, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, lead_id, description, scheduled_date, scheduled_time, created_at
    `, [params.id, sanitizedDescription, sanitizedScheduledDate, sanitizedScheduledTime]);

    // Add activity for the new follow-up
    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [params.id, 'New follow-up scheduled', sanitizedAuthor]);

    await client.query('COMMIT');

    return NextResponse.json({ followUp: rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to add follow-up' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}