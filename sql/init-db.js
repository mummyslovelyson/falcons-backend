import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function init() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isPg = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

  if (isPg) {
    console.log('Connecting to Neon PostgreSQL database...');
    const client = new pg.Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    const schemaPath = path.join(__dirname, 'schema-neon.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    await client.end();
    console.log('✅ Neon PostgreSQL schema and seeds successfully imported!');
    return;
  }

  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  await connection.query(sql);
  await connection.end();
  console.log('✅ MySQL schema imported into database "pathfinder".');
}

init().catch((err) => {
  console.error('❌ Failed to import schema:', err);
  process.exit(1);
});

