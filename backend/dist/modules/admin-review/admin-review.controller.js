import { AdminReviewService } from './admin-review.service.js';
export class AdminReviewController {
    static async reviewSubmission(req, res, next) {
        try {
            const adminId = req.user?.id;
            if (!adminId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { id } = req.params;
            const { decision, comment } = req.body;
            if (!decision || (decision !== 'approve' && decision !== 'reject')) {
                return res.status(400).json({ error: "decision is required and must be either 'approve' or 'reject'." });
            }
            const result = await AdminReviewService.reviewSubmission(adminId, id, decision, comment);
            res.status(200).json({
                message: `Submission review processed successfully: ${decision}`,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPendingSubmissions(req, res, next) {
        try {
            const submissions = await AdminReviewService.getSubmissionsForReview();
            res.status(200).json(submissions);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllUsers(req, res, next) {
        try {
            const users = await AdminReviewService.getAllUsers();
            res.status(200).json(users);
        }
        catch (error) {
            next(error);
        }
    }
    static async blockUser(req, res, next) {
        try {
            const { id } = req.params;
            const result = await AdminReviewService.blockUser(id);
            res.status(200).json({
                message: 'User blocked successfully',
                ...result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async unblockUser(req, res, next) {
        try {
            const { id } = req.params;
            const result = await AdminReviewService.unblockUser(id);
            res.status(200).json({
                message: 'User unblocked successfully',
                ...result
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async bookMentorCall(req, res, next) {
        try {
            const { title, description, startDateTime, endDateTime, attendeeEmail } = req.body;
            if (!title || !startDateTime || !endDateTime || !attendeeEmail) {
                return res.status(400).json({ error: 'title, startDateTime, endDateTime, and attendeeEmail are required.' });
            }
            const result = await AdminReviewService.bookMeeting(title, description, startDateTime, endDateTime, attendeeEmail);
            res.status(200).json({
                message: 'Google Meet call booked successfully',
                ...result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
