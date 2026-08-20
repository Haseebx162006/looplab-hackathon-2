import { Response, NextFunction } from 'express';
import { RoadmapsService } from './roadmaps.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class RoadmapsController {
  static async generateRoadmap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { skill_summary_id } = req.body;
      if (!skill_summary_id) {
        return res.status(400).json({ error: 'skill_summary_id is required.' });
      }

      const roadmap = await RoadmapsService.generateRoadmap(userId, skill_summary_id);
      res.status(201).json({
        message: 'Roadmap generated successfully',
        roadmap,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRoadmap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const roadmap = await RoadmapsService.getRoadmapById(userId, id);
      if (!roadmap) {
        return res.status(404).json({ error: 'Roadmap not found.' });
      }
      res.status(200).json(roadmap);
    } catch (error) {
      next(error);
    }
  }

  static async abandonRoadmap(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const result = await RoadmapsService.abandonRoadmap(userId, id);
      res.status(200).json({
        message: 'Roadmap abandoned successfully',
        roadmap: result
      });
    } catch (error) {
      next(error);
    }
  }
}
