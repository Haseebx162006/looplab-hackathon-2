import { Router } from 'express';
import { ProgressController } from './progress.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';

const router = Router();

router.get('/me/progress', requireAuth, ProgressController.getProgress);
router.get('/admin/:id/progress', requireAuth, requireAdmin, ProgressController.getUserProgress);

export default router;
