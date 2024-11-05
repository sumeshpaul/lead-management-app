import { sql } from '@vercel/postgres';

export async function query(text: string, params: any[] = []) {
  try {
    const result = await sql.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function createTables() {
  try {
    const createLeadsTable = await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        division VARCHAR(100) NOT NULL,
        assigned_to VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'New',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCommentsTable = await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        text TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createFollowUpsTable = await sql`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        description TEXT NOT NULL,
        scheduled_date DATE NOT NULL,
        scheduled_time TIME NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createVerificationCodesTable = await sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Tables created successfully!');
    return {
      createLeadsTable,
      createCommentsTable,
      createFollowUpsTable,
      createVerificationCodesTable,
    };
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}