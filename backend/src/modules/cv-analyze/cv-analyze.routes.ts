import { Router } from 'express';
import { CvAnalyzeController } from './cv-analyze.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/analyze', requireAuth, CvAnalyzeController.analyze);
router.post('/upload', requireAuth, CvAnalyzeController.upload);

export default router;
