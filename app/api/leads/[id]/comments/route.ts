import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

interface Comment {
  id: string;
  lead_id: string;
  text: string;
  author: string;
  created_at: string;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    const { rows } = await client.query<Comment>(`
      SELECT id, lead_id, text, author, created_at
      FROM comments
      WHERE lead_id = $1
      ORDER BY created_at DESC
    `, [params.id]);

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const client = await sql.connect();
  
  try {
    await client.query('BEGIN');

    const { text, author } = await request.json();

    // Validation and sanitization
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

    // Insert the comment
    const { rows } = await client.query<Comment>(`
      INSERT INTO comments (lead_id, text, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING id, lead_id, text, author, created_at
    `, [params.id, sanitizedText, sanitizedAuthor]);

    // Add activity for the new comment
    await client.query(`
      INSERT INTO activities (lead_id, description, author, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [params.id, 'New comment added', sanitizedAuthor]);

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