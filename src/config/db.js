import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || '';

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl:
          connectionString.includes('neon.tech') ||
          connectionString.includes('sslmode=require') ||
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
        max: 10,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pathfinder',
        max: 10,
      }
);

export async function query(sql, params = []) {
  let paramIndex = 1;
  let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

  if (/ON DUPLICATE KEY UPDATE/i.test(pgSql)) {
    if (/attendance/i.test(pgSql)) {
      pgSql = pgSql.replace(
        /ON DUPLICATE KEY UPDATE[\s\S]*/i,
        'ON CONFLICT (meeting_date, member_id) DO UPDATE SET name = EXCLUDED.name, class_name = EXCLUDED.class_name, status = EXCLUDED.status'
      );
    } else if (/club_settings/i.test(pgSql)) {
      pgSql = pgSql.replace(
        /ON DUPLICATE KEY UPDATE[\s\S]*/i,
        'ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload'
      );
    }
  }

  const result = await pool.query(pgSql, params);
  return result.rows || [];
}


