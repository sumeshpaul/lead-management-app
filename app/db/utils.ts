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

    const createActivitiesTable = await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id),
        description TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createUpdateTrigger = await sql`
      CREATE OR REPLACE FUNCTION update_modified_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_lead_modtime
          BEFORE UPDATE ON leads
          FOR EACH ROW
          EXECUTE FUNCTION update_modified_column();
    `;

    console.log('Tables created successfully!');
    return {
      createLeadsTable,
      createCommentsTable,
      createFollowUpsTable,
      createActivitiesTable,
      createUpdateTrigger,
    };
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}