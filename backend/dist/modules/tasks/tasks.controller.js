import { TasksService } from './tasks.service.js';
export class TasksController {
    static async submitTask(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { id } = req.params;
            const { content, links } = req.body;
            if (!content && (!links || links.length === 0)) {
                return res.status(400).json({ error: 'content or links are required.' });
            }
            const submission = await TasksService.submitTask(userId, id, content, links);
            res.status(201).json({
                message: 'Task submitted successfully. Pending mentor review.',
                submission,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSubmissions(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { id } = req.params;
            const submissions = await TasksService.getTaskSubmissions(userId, id);
            res.status(200).json(submissions);
        }
        catch (error) {
            next(error);
        }
    }
}
