import { Router } from 'express';
import {
  handleIngest,
  handleQuery,
  handleListChunks,
  handleDeleteChunk,
  handleListDrafts,
} from './rag.controller.js';

const router = Router();

router.post('/ingest', handleIngest);
router.post('/query', handleQuery);
router.get('/chunks', handleListChunks);
router.delete('/chunks/:id', handleDeleteChunk);
router.get('/drafts', handleListDrafts);

export default router;
