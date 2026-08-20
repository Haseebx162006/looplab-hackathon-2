import { OnboardingService } from './onboarding.service.js';
export class OnboardingController {
    static async upsertProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { education, skills, interests, career_goal, experience, cv_url } = req.body;
            const profile = await OnboardingService.upsertProfile(userId, {
                education,
                skills,
                interests,
                career_goal,
                experience,
                cv_url,
            });
            res.status(200).json({
                message: 'Profile updated successfully',
                profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const profile = await OnboardingService.getProfileByUserId(userId);
            if (!profile) {
                return res.status(404).json({ error: 'Profile not found' });
            }
            res.status(200).json({ profile });
        }
        catch (error) {
            next(error);
        }
    }
}
