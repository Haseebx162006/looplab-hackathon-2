import { pool } from '../../db/index.js';
import { ProfileInput } from './onboarding.types.js';

export class OnboardingService {
  static async upsertProfile(userId: string, input: ProfileInput) {
    const { education, skills, interests, career_goal, experience, cv_url, avatar_url, projects, certifications } = input;

    const query = `
      INSERT INTO profiles (user_id, education, skills, interests, career_goal, experience, cv_url, avatar_url, projects, certifications, profile_complete)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      ON CONFLICT (user_id)
      DO UPDATE SET
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        interests = EXCLUDED.interests,
        career_goal = EXCLUDED.career_goal,
        experience = EXCLUDED.experience,
        cv_url = COALESCE(EXCLUDED.cv_url, profiles.cv_url),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        projects = EXCLUDED.projects,
        certifications = EXCLUDED.certifications,
        profile_complete = true
      RETURNING id, user_id, education, skills, interests, career_goal, experience, profile_complete, cv_url, avatar_url, projects, certifications;
    `;

    const res = await pool.query(query, [
      userId,
      education || null,
      skills || [],
      interests || [],
      career_goal || null,
      experience || null,
      cv_url || null,
      avatar_url || null,
      projects || [],
      certifications || [],
    ]);

    return res.rows[0];
  }

  static async getProfileByUserId(userId: string) {
    const res = await pool.query(
      `SELECT id, user_id, education, skills, interests, career_goal, experience, profile_complete, cv_url, avatar_url, projects, certifications
       FROM profiles WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }
}
