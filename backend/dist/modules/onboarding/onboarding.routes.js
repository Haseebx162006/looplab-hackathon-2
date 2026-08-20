import { Router } from 'express';
import { OnboardingController } from './onboarding.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
const router = Router();
router.post('/profile', requireAuth, OnboardingController.upsertProfile);
export default router;
