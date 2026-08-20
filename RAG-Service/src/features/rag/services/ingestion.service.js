import crypto from 'crypto';
import { pool } from '../../../db/index.js';
import { chunkText } from './chunking.service.js';
import { embedTexts } from './embedding.service.js';

export async function ingestDocument({
  mentorId,
  menteeId,
  text,
  fileName,
  sourceType = 'mentor_document',
  sourceId,
  visibility = 'mentor',
  apiKey,
}) {
  if (!text || !text.trim()) {
    throw new Error('Cannot ingest empty text');
  }

  const rawChunks = chunkText(text);
  if (rawChunks.length === 0) {
    throw new Error('Text resulted in zero valid chunks');
  }

  const embeddings = await embedTexts(rawChunks, apiKey);

  const createdChunks = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const chunkContent = rawChunks[i];
    const embedding = embeddings[i];
    const contentHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
    const vecStr = `[${embedding.join(',')}]`;

    const insertQuery = `
      INSERT INTO knowledge_chunks (
        mentor_id, mentee_id, source_type, source_id,
        chunk_index, content_hash, content, embedding, visibility
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, $9)
      RETURNING id, mentor_id AS "mentorId", mentee_id AS "menteeId",
                source_type AS "sourceType", source_id AS "sourceId",
                chunk_index AS "chunkIndex", content, visibility, created_at AS "createdAt";
    `;

    const result = await pool.query(insertQuery, [
      mentorId,
      menteeId || null,
      sourceType,
      sourceId || null,
      i,
      contentHash,
      chunkContent,
      vecStr,
      visibility,
    ]);

    createdChunks.push(result.rows[0]);
  }

  return {
    ingestedCount: createdChunks.length,
    chunks: createdChunks,
  };
}
