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
      SELECT id, lead_id, text, author, created_at
      FROM comments
      WHERE lead_id = $1
      ORDER BY created_at DESC
    `, [id]);

    return NextResponse.json({ comments: rows });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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

    const { text, author } = await request.json();

    if (typeof text !== 'string' || typeof author !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input types' },
        { status: 400 }
      );
    }

    const sanitizedText = text.trim();
    const sanitizedAuthor = author.trim();

    if (!sanitizedText || !sanitizedAuthor) {
      return NextResponse.json(
        { error: 'Text and author are required' },
        { status: 400 }
      );
    }

    const { rows } = await client.query(`
      INSERT INTO comments (lead_id, text, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, lead_id, text, author, created_at
    `, [id, sanitizedText, sanitizedAuthor]);

    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [id, 'New comment added', sanitizedAuthor]);

    await client.query('COMMIT');

    return NextResponse.json({ comment: rows[0] }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
