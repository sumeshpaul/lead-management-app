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
      SELECT
        id,
        title,
        division,
        status,
        assigned_to as "assignedTo",
        created_at,
        updated_at
      FROM leads
      WHERE id = $1
    `, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const [followUps, comments, activities] = await Promise.all([
      client.query('SELECT * FROM follow_ups WHERE lead_id = $1', [id]),
      client.query('SELECT * FROM comments WHERE lead_id = $1', [id]),
      client.query('SELECT * FROM activities WHERE lead_id = $1', [id])
    ]);

    const lead = {
      ...rows[0],
      followUps: followUps.rows,
      comments: comments.rows,
      activities: activities.rows
    };

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await sql.connect();

  try {
    await client.query('BEGIN');

    const { title, division, status, assignedTo } = await request.json();

    if (typeof title !== 'string' || typeof division !== 'string' || typeof status !== 'string' || typeof assignedTo !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input types' },
        { status: 400 }
      );
    }

    const sanitizedTitle = title.trim();
    const sanitizedDivision = division.trim();
    const sanitizedStatus = status.trim();
    const sanitizedAssignedTo = assignedTo.trim();

    if (!sanitizedTitle || !sanitizedDivision || !sanitizedStatus || !sanitizedAssignedTo) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const { rows } = await client.query(`
      UPDATE leads
      SET title = $1, division = $2, status = $3, assigned_to = $4
      WHERE id = $5
      RETURNING
        id,
        title,
        division,
        status,
        assigned_to as "assignedTo",
        created_at,
        updated_at
    `, [sanitizedTitle, sanitizedDivision, sanitizedStatus, sanitizedAssignedTo, id]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [id, 'Lead updated', sanitizedAssignedTo]);

    await client.query('COMMIT');

    // Fetch full lead data for response
    const [followUps, comments, activities] = await Promise.all([
      client.query('SELECT * FROM follow_ups WHERE lead_id = $1', [id]),
      client.query('SELECT * FROM comments WHERE lead_id = $1', [id]),
      client.query('SELECT * FROM activities WHERE lead_id = $1', [id])
    ]);

    const lead = {
      ...rows[0],
      followUps: followUps.rows,
      comments: comments.rows,
      activities: activities.rows
    };

    return NextResponse.json({ lead });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const decoded = verifyRequestAuth(request);
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const client = await sql.connect();

  try {
    // With ON DELETE CASCADE, we only need to delete the lead
    const { rowCount } = await client.query('DELETE FROM leads WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
