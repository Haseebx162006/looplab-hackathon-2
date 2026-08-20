import { Response, NextFunction } from 'express';
import { TestsService } from './tests.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class TestsController {
  static async generateTest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { module_id, difficulty } = req.body;
      if (!module_id || !difficulty) {
        return res.status(400).json({ error: 'module_id and difficulty are required.' });
      }

      const result = await TestsService.generateTest(userId, { module_id, difficulty });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitTest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { answers } = req.body;
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'answers must be an array of question answer mappings.' });
      }

      const result = await TestsService.submitTest(userId, id, answers);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await TestsService.getTestById(userId, id);
      if (!result) {
        return res.status(404).json({ error: 'Test not found.' });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
