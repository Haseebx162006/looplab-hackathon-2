import { Router } from 'express';
import { SkillSummariesController } from './skill-summaries.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.post('/generate', requireAuth, SkillSummariesController.generateSummary);
router.get('/:id', requireAuth, SkillSummariesController.getSummary);
export default router;
