import { pool } from '../../../db/index.js';
import { ingestDocument } from './ingestion.service.js';
import { retrieveContext } from './retrieval.service.js';
import { buildPrompt } from './promptBuilder.service.js';
import { generateResponse } from './generation.service.js';
import { scoreGrounding } from './grounding.service.js';

export class RagService {
  static async ingest(payload) {
    return await ingestDocument(payload);
  }

  static async query(payload) {
    const { query, mentorId, menteeId, apiKey, generateAnswer = true } = payload;

    const chunks = await retrieveContext({ query, mentorId, menteeId, apiKey });

    if (chunks.length === 0) {
      return {
        answer: "I don't have enough information in my knowledge base to answer that.",
        confidenceScore: 0,
        chunks: [],
        abstained: true,
      };
    }

    if (!generateAnswer) {
      return {
        confidenceScore: chunks[0]?.score || 0.8,
        chunks,
        abstained: false,
      };
    }

    const { systemPrompt, userPrompt } = buildPrompt({ chunks, query });
    const answer = await generateResponse({ systemPrompt, userPrompt, apiKey });

    const confidenceScore = scoreGrounding(answer, chunks);
    const abstained = answer.includes("don't have enough information");

    return {
      answer,
      confidenceScore,
      chunks,
      abstained,
    };
  }

  static async listChunks(mentorId, limit = 50) {
    const query = `
      SELECT id, mentor_id AS "mentorId", mentee_id AS "menteeId",
             source_type AS "sourceType", source_id AS "sourceId",
             chunk_index AS "chunkIndex", content, visibility, created_at AS "createdAt"
      FROM knowledge_chunks
      WHERE mentor_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [mentorId, limit]);
    return result.rows;
  }

  static async deleteChunk(id, mentorId) {
    const result = await pool.query('DELETE FROM knowledge_chunks WHERE id = $1 AND mentor_id = $2', [id, mentorId]);
    return (result.rowCount ?? 0) > 0;
  }

  static async listDrafts(mentorId) {
    const query = `
      SELECT id, message_id AS "messageId", mentor_id AS "mentorId", mentee_id AS "menteeId",
             draft_content AS "draftContent", confidence_score AS "confidenceScore",
             retrieved_chunk_ids AS "retrievedChunkIds", status, created_at AS "createdAt"
      FROM message_drafts
      WHERE mentor_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [mentorId]);
    return result.rows;
  }

  static async listDocuments(mentorId) {
    const query = `
      SELECT id, file_name AS "fileName", created_at AS "createdAt"
      FROM rag_documents
      WHERE mentor_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [mentorId]);
    return result.rows;
  }

  static async deleteDocument(id, mentorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete chunks
      await client.query(
        'DELETE FROM knowledge_chunks WHERE document_id = $1 AND mentor_id = $2',
        [id, mentorId]
      );
      
      // Delete document mapping
      const result = await client.query(
        'DELETE FROM rag_documents WHERE id = $1 AND mentor_id = $2',
        [id, mentorId]
      );
      
      await client.query('COMMIT');
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
