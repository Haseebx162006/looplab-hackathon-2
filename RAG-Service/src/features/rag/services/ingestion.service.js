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

  let documentId = null;
  if (fileName) {
    documentId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO rag_documents (id, mentor_id, file_name) VALUES ($1, $2, $3)',
      [documentId, mentorId, fileName]
    );
  }

  const createdChunks = [];

  for (let i = 0; i < rawChunks.length; i++) {
    const chunkContent = rawChunks[i];
    const embedding = embeddings[i];
    const contentHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
    const vecStr = `[${embedding.join(',')}]`;
    const chunkId = crypto.randomUUID();
    const createdAt = new Date();
    const updatedAt = new Date();

    const insertQuery = `
      INSERT INTO knowledge_chunks (
        id, mentor_id, mentee_id, source_type, source_id,
        chunk_index, content_hash, content, embedding, visibility, created_at, updated_at, document_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, $10, $11, $12, $13)
      RETURNING id, mentor_id AS "mentorId", mentee_id AS "menteeId",
                source_type AS "sourceType", source_id AS "sourceId",
                chunk_index AS "chunkIndex", content, visibility, created_at AS "createdAt";
    `;

    console.log(`[RAG Ingestion Debug] SQL params count: ${[
      chunkId,
      mentorId,
      menteeId || null,
      sourceType,
      sourceId || null,
      i,
      contentHash,
      chunkContent,
      vecStr,
      visibility,
      createdAt,
      updatedAt,
    ].length}`, {
      chunkId,
      mentorId,
      menteeId: menteeId || null,
      sourceType,
      sourceId: sourceId || null,
      i,
      contentHash,
      chunkContentSnippet: chunkContent.substring(0, 50),
      vecStrLength: vecStr.length,
      visibility,
      createdAt,
      updatedAt
    });

    const result = await pool.query(insertQuery, [
      chunkId,
      mentorId,
      menteeId || null,
      sourceType,
      sourceId || null,
      i,
      contentHash,
      chunkContent,
      vecStr,
      visibility,
      createdAt,
      updatedAt,
      documentId,
    ]);

    createdChunks.push(result.rows[0]);
  }

  return {
    ingestedCount: createdChunks.length,
    chunks: createdChunks,
  };
}
