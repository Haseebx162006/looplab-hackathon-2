import { pool } from '../../../db/index.js';
import { embedText } from './embedding.service.js';
import { ragConfig } from '../rag.config.js';

export async function retrieveContext({ query, mentorId, menteeId, apiKey }) {
  if (!query || !query.trim()) return [];

  const { vectorLimit, ftsLimit, topK, rrfK, minSimilarity } = ragConfig.retrieval;

  try {
    const queryEmbedding = await embedText(query, apiKey);
    const vecStr = `[${queryEmbedding.join(',')}]`;

    const vectorQuery = `
      SELECT id, mentor_id AS "mentorId", mentee_id AS "menteeId",
             source_type AS "sourceType", source_id AS "sourceId",
             chunk_index AS "chunkIndex", content, visibility,
             1 - (embedding <=> $1::vector) AS score
      FROM knowledge_chunks
      WHERE mentor_id = $2
        AND (
          mentee_id IS NULL 
          OR mentee_id = $3
        )
        AND embedding IS NOT NULL
        AND 1 - (embedding <=> $1::vector) >= $4
      ORDER BY embedding <=> $1::vector ASC
      LIMIT $5;
    `;

    const vectorResult = await pool.query(vectorQuery, [
      vecStr,
      mentorId,
      menteeId || null,
      minSimilarity,
      vectorLimit,
    ]);
    const vectorRows = vectorResult.rows;

    const ftsQuery = `
      SELECT id, mentor_id AS "mentorId", mentee_id AS "menteeId",
             source_type AS "sourceType", source_id AS "sourceId",
             chunk_index AS "chunkIndex", content, visibility,
             ts_rank(search_vector, websearch_to_tsquery('english', $1)) AS score
      FROM knowledge_chunks
      WHERE mentor_id = $2
        AND (
          mentee_id IS NULL 
          OR mentee_id = $3
        )
        AND search_vector @@ websearch_to_tsquery('english', $1)
      ORDER BY score DESC
      LIMIT $4;
    `;

    let ftsRows = [];
    try {
      const ftsResult = await pool.query(ftsQuery, [
        query,
        mentorId,
        menteeId || null,
        ftsLimit,
      ]);
      ftsRows = ftsResult.rows;
    } catch {
      // FTS fallback
    }

    const scoreMap = new Map();

    const mergeRrf = (rows) => {
      rows.forEach((row, idx) => {
        const existing = scoreMap.get(row.id);
        const rrfScore = 1 / (rrfK + idx + 1);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scoreMap.set(row.id, { chunk: row, score: rrfScore });
        }
      });
    };

    mergeRrf(vectorRows);
    mergeRrf(ftsRows);

    const mergedResults = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => ({
        ...item.chunk,
        score: item.score,
      }));

    return mergedResults;
  } catch (error) {
    console.error('❌ RAG Retrieval failed:', error.message);
    return [];
  }
}
