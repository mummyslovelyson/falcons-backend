import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  console.log('Connecting to PostgreSQL database...');
  const client = new pg.Client({
    connectionString,
    ssl:
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require') ||
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });

  await client.connect();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(sql);
  await client.end();
  console.log('✅ PostgreSQL schema and seeds successfully imported into database.');
}

init().catch((err) => {
  console.error('❌ Failed to import PostgreSQL schema:', err);
  process.exit(1);
});
