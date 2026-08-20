import { OnboardingService } from './onboarding.service.js';
export class OnboardingController {
    static async upsertProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const { education, skills, interests, career_goal, experience } = req.body;
            const profile = await OnboardingService.upsertProfile(userId, {
                education,
                skills,
                interests,
                career_goal,
                experience,
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
}
