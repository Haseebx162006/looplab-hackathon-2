import pg from 'pg';
import pgvector from 'pgvector/pg';
import { config } from '../config/env.js';
import { runMigrations } from './migrations/migrate.js';

export const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
    })
  : new pg.Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
    });

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
