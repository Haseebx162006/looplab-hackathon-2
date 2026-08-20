import { SkillSummariesService } from './skill-summaries.service.js';
export class SkillSummariesController {
    static async generateSummary(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { test_id } = req.body;
            if (!test_id) {
                return res.status(400).json({ error: 'test_id is required.' });
            }
            const summary = await SkillSummariesService.generateSummary(userId, test_id);
            res.status(201).json({
                message: 'Skill summary generated successfully',
                summary,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSummary(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { id } = req.params;
            const summary = await SkillSummariesService.getSummaryById(userId, id);
            if (!summary) {
                return res.status(404).json({ error: 'Skill summary not found.' });
            }
            res.status(200).json(summary);
        }
        catch (error) {
            next(error);
        }
    }
}
