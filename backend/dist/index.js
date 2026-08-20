"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("./config/env.js");
const index_js_1 = require("./db/index.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const health_routes_js_1 = __importDefault(require("./features/health/health.routes.js"));
const vector_routes_js_1 = __importDefault(require("./features/vector-search/vector.routes.js"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api', health_routes_js_1.default);
app.use('/api/vector', vector_routes_js_1.default);
// Root route
app.get('/', (_req, res) => {
    res.json({
        message: '🚀 Express + PostgreSQL + pgvector Backend API',
        endpoints: {
            health: 'GET /api/health',
            insertVector: 'POST /api/vector/items',
            searchVector: 'POST /api/vector/search',
        },
    });
});
// Global Error Handler
app.use(errorHandler_js_1.errorHandler);
// Start Server
async function startServer() {
    await (0, index_js_1.initDatabase)();
    app.listen(env_js_1.config.port, () => {
        console.log(`⚡ Server running on http://localhost:${env_js_1.config.port} in ${env_js_1.config.nodeEnv} mode`);
    });
}
startServer();
exports.default = app;
