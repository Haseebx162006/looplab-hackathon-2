-- Mentor Style Profiles table
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

-- Knowledge Chunks table with pgvector & tsvector
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

-- RAG Ingestion Jobs table
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

-- Message Drafts table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_mentor ON knowledge_chunks(mentor_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_search ON knowledge_chunks USING gin (search_vector);
