import { Router } from 'express';
import { ProgressController } from './progress.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.get('/me/progress', requireAuth, ProgressController.getProgress);
export default router;
