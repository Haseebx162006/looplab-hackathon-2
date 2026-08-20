import { CertificatesService } from './certificates.service.js';
export class CertificatesController {
    static async getCertificate(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
}
