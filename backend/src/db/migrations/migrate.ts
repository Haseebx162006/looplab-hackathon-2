import { Pool } from 'pg';

export const sqlMigrations = [
  {
    name: '001_init_pgvector',
    sql: `CREATE EXTENSION IF NOT EXISTS vector;`,
  },
  {
    name: '002_create_rag_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS mentor_style_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mentor_id VARCHAR(255) NOT NULL UNIQUE,
        tone JSONB DEFAULT '{"brevity": 0.5, "formality": 0.5}'::jsonb,
        vocab_prefs JSONB DEFAULT '{}'::jsonb,
        phrase_patterns JSONB DEFAULT '[]'::jsonb,
        style_examples JSONB DEFAULT '[]'::jsonb,
        auto_reply_enabled BOOLEAN DEFAULT false,
        auto_reply_limit INTEGER DEFAULT 100,
        auto_reply_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mentor_id VARCHAR(255) NOT NULL,
        mentee_id VARCHAR(255),
        source_type VARCHAR(50) DEFAULT 'mentor_document',
        source_id VARCHAR(255),
        chunk_index INTEGER DEFAULT 0,
        content_hash VARCHAR(64),
        content TEXT NOT NULL,
        embedding vector(768),
        search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
        visibility VARCHAR(20) DEFAULT 'mentor',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rag_ingestion_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mentor_id VARCHAR(255) NOT NULL,
        source_type VARCHAR(50) DEFAULT 'mentor_document',
        source_id VARCHAR(255),
        text TEXT NOT NULL,
        file_name VARCHAR(255),
        visibility VARCHAR(20) DEFAULT 'mentor',
        status VARCHAR(20) DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id VARCHAR(255),
        mentor_id VARCHAR(255) NOT NULL,
        mentee_id VARCHAR(255),
        draft_content TEXT NOT NULL,
        confidence_score DOUBLE PRECISION DEFAULT 0.0,
        retrieved_chunk_ids JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_mentor ON knowledge_chunks(mentor_id);
      CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_search ON knowledge_chunks USING gin (search_vector);
    `,
  },
  {
    name: '003_create_auth_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS otp_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        otp_code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
];

export async function runMigrations(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const migration of sqlMigrations) {
      const checkResult = await client.query(
        'SELECT name FROM _schema_migrations WHERE name = $1',
        [migration.name]
      );

      if (checkResult.rows.length === 0) {
        await client.query('BEGIN');
        await client.query(migration.sql);

        if (migration.name === '002_create_rag_tables') {
          try {
            await client.query(`
              CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
              ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
            `);
          } catch {
            // HNSW index created or skipped
          }
        }

        await client.query(
          'INSERT INTO _schema_migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied migration: ${migration.name}`);
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
