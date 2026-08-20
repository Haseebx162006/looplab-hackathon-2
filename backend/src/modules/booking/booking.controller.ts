import { Response, NextFunction } from 'express';
import { BookingService } from './booking.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';

export class BookingController {
  static async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, description } = req.body;
      const request = await BookingService.createRequest(userId, title, description);
      res.status(201).json({
        message: 'Mentor call requested successfully.',
        request,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const requests = await BookingService.getUserRequests(userId);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requests = await BookingService.getAdminRequests();
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  }

  static async respondToRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const { decision, scheduledAt, durationMinutes, comment } = req.body;

      if (!decision || (decision !== 'approve' && decision !== 'reject')) {
        return res.status(400).json({ error: "decision is required and must be either 'approve' or 'reject'." });
      }

      const request = await BookingService.respondToRequest(
        adminId,
        id,
        decision,
        scheduledAt,
        durationMinutes ? parseInt(durationMinutes, 10) : 30,
        comment
      );

      res.status(200).json({
        message: `Request successfully ${decision === 'approve' ? 'approved' : 'rejected'}.`,
        request,
      });
    } catch (error) {
      next(error);
    }
  }
}
