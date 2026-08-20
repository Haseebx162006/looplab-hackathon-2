import { Router } from 'express';
import { AdminReviewController } from './admin-review.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';

const router = Router();

router.post('/submissions/:id/review', requireAuth, requireAdmin, AdminReviewController.reviewSubmission);
router.get('/submissions', requireAuth, requireAdmin, AdminReviewController.getPendingSubmissions);

export default router;
