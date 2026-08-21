import { Router } from 'express';
import { BookingController } from './booking.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';
const router = Router();
// Student routes
router.post('/requests', requireAuth, BookingController.createRequest);
router.get('/requests', requireAuth, BookingController.getUserRequests);
// Admin routes
router.get('/admin/requests', requireAuth, requireAdmin, BookingController.getAdminRequests);
router.post('/admin/requests/:id/respond', requireAuth, requireAdmin, BookingController.respondToRequest);
export default router;
