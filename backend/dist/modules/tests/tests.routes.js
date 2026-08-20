import { Router } from 'express';
import { TestsController } from './tests.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.post('/generate', requireAuth, TestsController.generateTest);
router.post('/:id/submit', requireAuth, TestsController.submitTest);
router.get('/:id', requireAuth, TestsController.getTest);
export default router;
