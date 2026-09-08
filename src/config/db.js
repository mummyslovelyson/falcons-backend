import mysql from 'mysql2/promise';

const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
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

export const pool = mysql.createPool(poolConfig);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

