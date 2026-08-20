"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createItemsTableIfNotExists = createItemsTableIfNotExists;
exports.insertVectorDocument = insertVectorDocument;
exports.searchSimilarVectors = searchSimilarVectors;
const pg_1 = __importDefault(require("pgvector/pg"));
const index_js_1 = require("../../db/index.js");
async function createItemsTableIfNotExists(dimensions = 3) {
    const query = `
    CREATE TABLE IF NOT EXISTS vector_items (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding vector(${dimensions})
    );
  `;
    await index_js_1.pool.query(query);
}
async function insertVectorDocument(doc) {
    const client = await index_js_1.pool.connect();
    try {
        await pg_1.default.registerTypes(client);
        const query = `
      INSERT INTO vector_items (title, content, embedding)
      VALUES ($1, $2, $3)
      RETURNING id, title, content;
    `;
        const values = [doc.title, doc.content, pg_1.default.toSql(doc.embedding)];
        const res = await client.query(query, values);
        return res.rows[0];
    }
    finally {
        client.release();
    }
}
async function searchSimilarVectors(queryEmbedding, limit = 5) {
    const client = await index_js_1.pool.connect();
    try {
        await pg_1.default.registerTypes(client);
        // Using Cosine distance operator (<=>)
        const query = `
      SELECT id, title, content, embedding <=> $1 AS distance
      FROM vector_items
      ORDER BY distance ASC
      LIMIT $2;
    `;
        const values = [pg_1.default.toSql(queryEmbedding), limit];
        const res = await client.query(query, values);
        return res.rows;
    }
    finally {
        client.release();
    }
}
