import mysql from 'mysql2/promise';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL || '';
const isPg = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://');

let pool;

if (isPg) {
  pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });
} else {
  const mysqlConfig = databaseUrl
    ? {
        uri: databaseUrl,
        waitForConnections: true,
        connectionLimit: 10,
        dateStrings: true,
        multipleStatements: true,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'pathfinder',
        waitForConnections: true,
        connectionLimit: 10,
        dateStrings: true,
        multipleStatements: true,
      };
  pool = mysql.createPool(mysqlConfig);
}

export { pool };

export async function query(sql, params = []) {
  if (isPg) {
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

  const [rows] = await pool.execute(sql, params);
  return rows;
}

