import { pool } from '../../db/index.js';
export async function insertVectorItem({ title, content, vector }) {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS vector_demo_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      embedding vector(3),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const vecStr = `[${vector.join(',')}]`;
    const res = await pool.query('INSERT INTO vector_demo_items (title, content, embedding) VALUES ($1, $2, $3::vector) RETURNING id, title, content, created_at;', [title, content, vecStr]);
    return res.rows[0];
}
export async function searchSimilarVectors(vector, limit = 5) {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS vector_demo_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      embedding vector(3),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
    const vecStr = `[${vector.join(',')}]`;
    const res = await pool.query('SELECT id, title, content, embedding <=> $1::vector as distance FROM vector_demo_items ORDER BY distance ASC LIMIT $2;', [vecStr, limit]);
    return res.rows;
}
