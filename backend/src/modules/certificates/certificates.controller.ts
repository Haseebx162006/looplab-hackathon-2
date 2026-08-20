import { Response, NextFunction } from 'express';
import { CertificatesService } from './certificates.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class CertificatesController {
  static async getCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const cert = await CertificatesService.getCertificateDetails(userId, id);
      if (!cert) {
        return res.status(404).json({ error: 'Certificate not found.' });
      }

      res.status(200).json(cert);
    } catch (error) {
      next(error);
    }
  }
}
