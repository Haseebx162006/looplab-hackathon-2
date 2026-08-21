import { Router } from 'express';
import { CertificatesController } from './certificates.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

import { requireAdmin } from '../../middleware/admin.middleware.js';

const router = Router();

router.get('/:id', requireAuth, CertificatesController.getCertificate);
router.post('/issue', requireAuth, requireAdmin, CertificatesController.issue);

export default router;
