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
  {
    name: '004_fix_users_columns',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
    `,
  },
  {
    name: '005_set_users_id_default',
    sql: `
      ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `,
  },
  {
    name: '006_make_users_role_nullable',
    sql: `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name='users' AND column_name='role') THEN
          EXECUTE 'ALTER TABLE users ALTER COLUMN role DROP NOT NULL';
        END IF;
      END $$;
    `,
  },
  {
    name: '007_create_learning_platform_tables',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        education TEXT,
        skills TEXT[],
        interests TEXT[],
        career_goal TEXT,
        experience TEXT,
        profile_complete BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        difficulty VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        score DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS test_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer TEXT NOT NULL,
        student_answer TEXT
      );

      CREATE TABLE IF NOT EXISTS skill_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        strengths TEXT[] NOT NULL,
        weaknesses TEXT[] NOT NULL,
        skill_levels JSONB NOT NULL,
        missing_skills TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roadmaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        skill_summary_id UUID NOT NULL REFERENCES skill_summaries(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS roadmap_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        "order" INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
      );

      CREATE TABLE IF NOT EXISTS roadmap_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID NOT NULL REFERENCES roadmap_sections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'not_started'
      );

      CREATE TABLE IF NOT EXISTS task_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES roadmap_tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        decision VARCHAR(50) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_roadmap_certificate UNIQUE(user_id, roadmap_id)
      );

      INSERT INTO modules (name, description) VALUES
        ('AI Engineering', 'Learn how to build AI-powered applications, retrieve knowledge using RAG, and orchestrate agent workflows.'),
        ('Backend Development', 'Learn how to design API architectures, work with databases, and handle scale.')
      ON CONFLICT (name) DO NOTHING;
    `,
  },
  {
    name: '008_recreate_learning_platform_tables',
    sql: `
      DROP TABLE IF EXISTS certificates CASCADE;
      DROP TABLE IF EXISTS task_reviews CASCADE;
      DROP TABLE IF EXISTS task_submissions CASCADE;
      DROP TABLE IF EXISTS roadmap_tasks CASCADE;
      DROP TABLE IF EXISTS roadmap_sections CASCADE;
      DROP TABLE IF EXISTS roadmaps CASCADE;
      DROP TABLE IF EXISTS skill_summaries CASCADE;
      DROP TABLE IF EXISTS test_questions CASCADE;
      DROP TABLE IF EXISTS tests CASCADE;
      DROP TABLE IF EXISTS profiles CASCADE;
      DROP TABLE IF EXISTS modules CASCADE;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

      CREATE TABLE profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        education TEXT,
        skills TEXT[],
        interests TEXT[],
        career_goal TEXT,
        experience TEXT,
        profile_complete BOOLEAN DEFAULT false
      );

      CREATE TABLE modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        difficulty VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        score DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE test_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options TEXT[] NOT NULL,
        correct_answer TEXT NOT NULL,
        student_answer TEXT
      );

      CREATE TABLE skill_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
        strengths TEXT[] NOT NULL,
        weaknesses TEXT[] NOT NULL,
        skill_levels JSONB NOT NULL,
        missing_skills TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE roadmaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        skill_summary_id UUID NOT NULL REFERENCES skill_summaries(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE roadmap_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        "order" INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
      );

      CREATE TABLE roadmap_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID NOT NULL REFERENCES roadmap_sections(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        "order" INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'not_started'
      );

      CREATE TABLE task_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES roadmap_tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE task_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        submission_id UUID NOT NULL REFERENCES task_submissions(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        decision VARCHAR(50) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        roadmap_id UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_roadmap_certificate UNIQUE(user_id, roadmap_id)
      );

      INSERT INTO modules (name, description) VALUES
        ('AI Engineering', 'Learn how to build AI-powered applications, retrieve knowledge using RAG, and orchestrate agent workflows.'),
        ('Backend Development', 'Learn how to design API architectures, work with databases, and handle scale.')
      ON CONFLICT (name) DO NOTHING;
    `,
  },
  {
    name: '009_add_user_blocking',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
    `,
  },
  {
    name: '010_add_cv_url_to_profiles',
    sql: `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
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

    // Paka Solution: If incompatible columns (first_name, role) exist in users table, perform a clean reset
    try {
      const hasColumn = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = current_schema() AND table_name = 'users' AND column_name IN ('first_name', 'last_name');
      `);
      if (hasColumn.rows.length > 0) {
        console.log('⚠️ Incompatible pre-existing users table detected. Performing clean reset...');
        await client.query('DROP TABLE IF EXISTS otp_verifications CASCADE;');
        await client.query('DROP TABLE IF EXISTS users CASCADE;');
        await client.query("DELETE FROM _schema_migrations WHERE name IN ('003_create_auth_tables', '004_fix_users_columns', '005_set_users_id_default', '006_make_users_role_nullable', '007_create_learning_platform_tables', '008_recreate_learning_platform_tables');");
      }
    } catch (e) {
      // Users table doesn't exist yet
    }

    for (const migration of sqlMigrations) {
      const checkResult = await client.query(
        'SELECT name FROM _schema_migrations WHERE name = $1',
        [migration.name]
      );

      if (checkResult.rows.length === 0) {
        await client.query('BEGIN');
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO _schema_migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied migration: ${migration.name}`);

        if (migration.name === '002_create_rag_tables') {
          try {
            await client.query(`
              CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
              ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
            `);
          } catch (e: any) {
            // HNSW index created or skipped (e.g. pgvector < 0.5.0)
            console.log('ℹ️ HNSW index creation skipped or unsupported, falling back to flat index');
          }
        }
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
