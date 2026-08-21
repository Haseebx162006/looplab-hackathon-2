import { Router } from 'express';
import { RoadmapsController } from './roadmaps.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.post('/generate', requireAuth, RoadmapsController.generateRoadmap);
router.post('/:id/abandon', requireAuth, RoadmapsController.abandonRoadmap);
router.post('/:id/resume', requireAuth, RoadmapsController.resumeRoadmap);
router.get('/:id', requireAuth, RoadmapsController.getRoadmap);
export default router;
