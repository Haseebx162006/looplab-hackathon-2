import { Response, NextFunction } from 'express';
import { TasksService } from './tasks.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class TasksController {
  static async submitTask(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'content is required.' });
      }

      const submission = await TasksService.submitTask(userId, id, content);
      res.status(201).json({
        message: 'Task submitted successfully. Pending mentor review.',
        submission,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const submissions = await TasksService.getTaskSubmissions(userId, id);
      res.status(200).json(submissions);
    } catch (error) {
      next(error);
    }
  }
}
