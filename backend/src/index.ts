import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDatabase } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './features/health/health.routes.js';
import vectorRoutes from './features/vector-search/vector.routes.js';
import ragRoutes from './features/rag/rag.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import onboardingRoutes from './modules/onboarding/onboarding.routes.js';
import modulesRoutes from './modules/modules/modules.routes.js';
import testsRoutes from './modules/tests/tests.routes.js';
import skillSummariesRoutes from './modules/skill-summaries/skill-summaries.routes.js';
import roadmapsRoutes from './modules/roadmaps/roadmaps.routes.js';
import tasksRoutes from './modules/tasks/tasks.routes.js';
import adminReviewRoutes from './modules/admin-review/admin-review.routes.js';
import certificatesRoutes from './modules/certificates/certificates.routes.js';
import progressRoutes from './modules/progress/progress.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);
app.use('/api/vector', vectorRoutes);
app.use('/api/rag', ragRoutes);
app.use('/auth', authRoutes);
app.use('/onboarding', onboardingRoutes);
app.use('/modules', modulesRoutes);
app.use('/tests', testsRoutes);
app.use('/skill-summary', skillSummariesRoutes);
app.use('/roadmaps', roadmapsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/admin', adminReviewRoutes);
app.use('/certificates', certificatesRoutes);
app.use('/users', progressRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: '🚀 Express + PostgreSQL + pgvector Backend API (TypeScript)',
    endpoints: {
      health: 'GET /api/health',
      insertVector: 'POST /api/vector/items',
      searchVector: 'POST /api/vector/search',
      ragIngest: 'POST /api/rag/ingest',
      ragQuery: 'POST /api/rag/query',
      ragChunks: 'GET /api/rag/chunks',
      authSignup: 'POST /auth/signup',
      authVerifyOtp: 'POST /auth/verify-otp',
      authResendOtp: 'POST /auth/resend-otp',
      authLogin: 'POST /auth/login',
      authMe: 'GET /auth/me (Protected)',
    },
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  app.listen(config.port, () => {
    console.log(`⚡ Server running on http://localhost:${config.port} in ${config.nodeEnv} mode (TS)`);
  });
  
  // Initialize database in the background
  await initDatabase();
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
