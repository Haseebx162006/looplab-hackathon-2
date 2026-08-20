import { Router } from 'express';
import { AdminReviewController } from './admin-review.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';

const router = Router();

router.post('/submissions/:id/review', requireAuth, requireAdmin, AdminReviewController.reviewSubmission);
router.get('/submissions', requireAuth, requireAdmin, AdminReviewController.getPendingSubmissions);
router.get('/users', requireAuth, requireAdmin, AdminReviewController.getAllUsers);
router.post('/users/:id/block', requireAuth, requireAdmin, AdminReviewController.blockUser);
router.post('/users/:id/unblock', requireAuth, requireAdmin, AdminReviewController.unblockUser);
router.post('/booking/meet', requireAuth, requireAdmin, AdminReviewController.bookMentorCall);

export default router;
