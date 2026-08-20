import { Router } from 'express';
import { handleInsertItem, handleSearchVector } from './vector.controller.js';
const router = Router();
router.post('/items', handleInsertItem);
router.post('/search', handleSearchVector);
export default router;
