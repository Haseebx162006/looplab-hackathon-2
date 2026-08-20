import { ProgressService } from './progress.service.js';
export class ProgressController {
    static async getProgress(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const result = await ProgressService.getProgressSummary(userId);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
