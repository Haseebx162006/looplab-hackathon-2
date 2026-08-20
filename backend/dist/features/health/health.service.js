"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSystemHealth = checkSystemHealth;
const index_js_1 = require("../../db/index.js");
async function checkSystemHealth() {
    let dbStatus = 'disconnected';
    let pgvectorStatus = 'unknown';
    try {
        const result = await index_js_1.pool.query("SELECT extname FROM pg_extension WHERE extname = 'vector'");
        dbStatus = 'connected';
        pgvectorStatus = result.rows.length > 0 ? 'installed' : 'not_installed';
    }
    catch {
        dbStatus = 'disconnected';
    }
    return {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
            pgvector: pgvectorStatus,
        },
    };
}
