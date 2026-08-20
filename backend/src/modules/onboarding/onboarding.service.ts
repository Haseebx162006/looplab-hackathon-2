import { pool } from '../../db/index.js';
import { ProfileInput } from './onboarding.types.js';

export class OnboardingService {
  static async upsertProfile(userId: string, input: ProfileInput) {
    const { education, skills, interests, career_goal, experience, cv_url } = input;

    const query = `
      INSERT INTO profiles (user_id, education, skills, interests, career_goal, experience, cv_url, profile_complete)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (user_id)
      DO UPDATE SET
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        interests = EXCLUDED.interests,
        career_goal = EXCLUDED.career_goal,
        experience = EXCLUDED.experience,
        cv_url = COALESCE(EXCLUDED.cv_url, profiles.cv_url),
        profile_complete = true
      RETURNING *;
    `;

    const res = await pool.query(query, [
      userId,
      education || null,
      skills || [],
      interests || [],
      career_goal || null,
      experience || null,
      cv_url || null,
    ]);

    return res.rows[0];
  }

  static async getProfileByUserId(userId: string) {
    const res = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return res.rows[0] || null;
  }
}
