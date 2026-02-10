import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { verifyRequestAuth } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await sql.connect();

  try {
    const { rows } = await client.query(`
      SELECT id, lead_id, description, scheduled_date, scheduled_time, created_at
      FROM follow_ups
      WHERE lead_id = $1
      ORDER BY scheduled_date ASC, scheduled_time ASC
    `, [id]);

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    const { description, scheduledDate, scheduledTime, author } = await request.json();

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

    const { rows } = await client.query(`
      INSERT INTO follow_ups (lead_id, description, scheduled_date, scheduled_time, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING id, lead_id, description, scheduled_date, scheduled_time, created_at
    `, [id, sanitizedDescription, sanitizedScheduledDate, sanitizedScheduledTime]);

    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [id, 'New follow-up scheduled', sanitizedAuthor]);

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
