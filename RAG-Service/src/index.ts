import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import ragRoutes from './features/rag/rag.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// RAG Routes mounted at /api/rag
app.use('/api/rag', ragRoutes);

// Base status endpoint
app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'SEEKH RAG Microservice',
    timestamp: new Date().toISOString()
  });
});

app.listen(config.port, () => {
  console.log(`🚀 SEEKH RAG Microservice running on http://localhost:${config.port} in ${config.nodeEnv} mode`);
});

export default app;
