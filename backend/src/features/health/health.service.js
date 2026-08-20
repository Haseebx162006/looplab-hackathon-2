import { pool } from '../../db/index.js';

export async function checkHealth() {
  let dbStatus = 'disconnected';
  let pgvectorStatus = 'disabled';

  try {
    const res = await pool.query('SELECT 1 as conn, EXISTS (SELECT 1 FROM pg_extension WHERE extname = $1) as vector_exists;', ['vector']);
    if (res.rows[0]?.conn === 1) {
      dbStatus = 'connected';
    }
    if (res.rows[0]?.vector_exists) {
      pgvectorStatus = 'enabled';
    }
  } catch {
    dbStatus = 'error';
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    pgvector: pgvectorStatus,
    uptime: process.uptime(),
  };
}
