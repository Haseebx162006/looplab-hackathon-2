import pg from 'pg';
import pgvector from 'pgvector/pg';
import { config } from '../config/env.js';
import { runMigrations } from './migrations/migrate.js';

export const pool = (() => {
  let connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    try {
      // Parse the connection string to find the password and url-encode it to handle special characters like + or @
      const match = connectionString.match(/^(postgresql:\/\/|postgres:\/\/)([^:]+):(.*)@([^@]+)$/);
      if (match) {
        const protocol = match[1];
        const user = match[2];
        const rawPassword = match[3];
        const hostInfo = match[4];
        
        // Only encode if it isn't already encoded (doesn't contain %)
        const encodedPassword = rawPassword.includes('%') ? rawPassword : encodeURIComponent(rawPassword);
        connectionString = `${protocol}${user}:${encodedPassword}@${hostInfo}`;
      }
    } catch (e) {
      console.warn('⚠️ Error parsing DATABASE_URL for encoding:', e);
    }
  }

  return connectionString
    ? new pg.Pool({
        connectionString,
        connectionTimeoutMillis: 5000,
        ssl: connectionString.includes('supabase') ? { rejectUnauthorized: false } : undefined
      })
    : new pg.Pool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        connectionTimeoutMillis: 5000,
      });
})();

export async function initDatabase(): Promise<boolean> {
  let client: any;
  try {
    client = await pool.connect();
    await pgvector.registerTypes(client);

    await runMigrations(pool);

    console.log('✅ Database connected & schema migrations executed successfully.');
    return true;
  } catch (error: any) {
    console.warn('⚠️ Postgres database initialization note:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}
