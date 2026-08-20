import { Router } from 'express';
import { CertificatesController } from './certificates.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/:id', requireAuth, CertificatesController.getCertificate);

export default router;
