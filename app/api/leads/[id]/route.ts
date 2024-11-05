import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

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
  activities: any[];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
    `, [params.id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const [followUps, comments, activities] = await Promise.all([
      client.query('SELECT * FROM follow_ups WHERE lead_id = $1', [params.id]),
      client.query('SELECT * FROM comments WHERE lead_id = $1', [params.id]),
      client.query('SELECT * FROM activities WHERE lead_id = $1', [params.id])
    ]);

    const lead: Lead = {
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    await client.query('BEGIN');

    const { title, division, status, assignedTo } = await request.json();

    // Validation and sanitization
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

    // Update the lead
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
    `, [sanitizedTitle, sanitizedDivision, sanitizedStatus, sanitizedAssignedTo, params.id]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Add activity for the update
    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [params.id, 'Lead updated', sanitizedAssignedTo]);

    await client.query('COMMIT');

    const lead: Lead = {
      ...rows[0],
      followUps: [],
      comments: [],
      activities: [{
        id: rows[0].id,
        description: 'Lead updated',
        author: sanitizedAssignedTo,
        created_at: new Date().toISOString()
      }]
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    await client.query('BEGIN');

    // Delete associated records first
    await client.query('DELETE FROM activities WHERE lead_id = $1', [params.id]);
    await client.query('DELETE FROM comments WHERE lead_id = $1', [params.id]);
    await client.query('DELETE FROM follow_ups WHERE lead_id = $1', [params.id]);

    // Delete the lead
    const { rowCount } = await client.query('DELETE FROM leads WHERE id = $1', [params.id]);

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}