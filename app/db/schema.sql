CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  division VARCHAR(100) NOT NULL,
  assigned_to VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'New',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  text TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE follow_ups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  description TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Add this to the end of your existing schema.sql file

CREATE TABLE activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  description TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Modify the leads table to include an updated_at trigger
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

    const createActivitiesTable = await sql`
  CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    description TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;