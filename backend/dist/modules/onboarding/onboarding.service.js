import { pool } from '../../db/index.js';
export class OnboardingService {
    static async upsertProfile(userId, input) {
        const { education, skills, interests, career_goal, experience } = input;
        const query = `
      INSERT INTO profiles (user_id, education, skills, interests, career_goal, experience, profile_complete)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      ON CONFLICT (user_id)
      DO UPDATE SET
        education = EXCLUDED.education,
        skills = EXCLUDED.skills,
        interests = EXCLUDED.interests,
        career_goal = EXCLUDED.career_goal,
        experience = EXCLUDED.experience,
        profile_complete = true
      RETURNING *;
    `;
        const res = await pool.query(query, [
            userId,
            education || null,
            skills || [],
            interests || [],
            career_goal || null,
            experience || null
        ]);
        return res.rows[0];
    }
    static async getProfileByUserId(userId) {
        const res = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        return res.rows[0] || null;
    }
}
