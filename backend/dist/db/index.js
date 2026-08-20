"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initDatabase = initDatabase;
const pg_1 = __importDefault(require("pg"));
const pg_2 = __importDefault(require("pgvector/pg"));
const env_js_1 = require("../config/env.js");
exports.pool = new pg_1.default.Pool({
    host: env_js_1.config.db.host,
    port: env_js_1.config.db.port,
    database: env_js_1.config.db.database,
    user: env_js_1.config.db.user,
    password: env_js_1.config.db.password,
});
async function initDatabase() {
    let client;
    try {
        client = await exports.pool.connect();
        await pg_2.default.registerTypes(client);
        await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('✅ Database connected and pgvector extension verified.');
        return true;
    }
    catch (error) {
        console.warn('⚠️ Postgres database initialization note:', error.message);
        return false;
    }
    finally {
        if (client) {
            client.release();
        }
    }
}
