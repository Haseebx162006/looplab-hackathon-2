import { Router } from 'express';
import { TasksController } from './tasks.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.post('/:id/submit', requireAuth, TasksController.submitTask);
router.get('/:id/submissions', requireAuth, TasksController.getSubmissions);
export default router;
