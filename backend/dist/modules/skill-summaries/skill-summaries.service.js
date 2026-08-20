import { pool } from '../../db/index.js';
import { config } from '../../config/env.js';
export class SkillSummariesService {
    static async generateSummary(userId, testId) {
        // 1. Fetch test
        const testRes = await pool.query('SELECT * FROM tests WHERE id = $1 AND user_id = $2', [testId, userId]);
        const test = testRes.rows[0];
        if (!test) {
            throw { status: 404, message: 'Test not found or does not belong to you.' };
        }
        if (test.status !== 'completed') {
            throw { status: 400, message: 'Test is not completed yet. Please submit the test before generating a skill summary.' };
        }
        // 2. Fetch user and profile
        const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0];
        if (!profile || !profile.profile_complete) {
            throw { status: 400, message: 'Profile is incomplete. Please complete your onboarding profile first.' };
        }
        // 3. Fetch test questions and answers
        const questionsRes = await pool.query('SELECT question, correct_answer, student_answer FROM test_questions WHERE test_id = $1', [testId]);
        const questions = questionsRes.rows;
        const assessment_results = questions.map((q) => ({
            question: q.question,
            answer: q.student_answer || '',
            correct_answer: q.correct_answer,
            is_correct: (q.student_answer || '').trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()
        }));
        // 4. Call AI Agent Service
        let skillProfile;
        try {
            const response = await fetch(`${config.aiAgentServiceUrl}/agent/analyze-skills`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_profile: {
                        name: user.name,
                        experience_level: profile.experience || 'Beginner',
                        background: profile.education || '',
                        interests: profile.interests || [],
                    },
                    assessment_results,
                    test_score: test.score || 0
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI Service error: ${response.status} - ${errorText}`);
            }
            skillProfile = await response.json();
        }
        catch (error) {
            console.error('Failed to call AI Agent Service for skill analysis:', error);
            throw { status: 502, message: `AI Agent Service call failed: ${error.message || error}` };
        }
        // 5. Store in DB
        const insertRes = await pool.query(`INSERT INTO skill_summaries (user_id, module_id, test_id, strengths, weaknesses, skill_levels, missing_skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [
            userId,
            test.module_id,
            testId,
            skillProfile.strengths || [],
            skillProfile.weaknesses || [],
            JSON.stringify(skillProfile.skill_levels || {}),
            skillProfile.missing_skills || [],
        ]);
        return insertRes.rows[0];
    }
    static async getSummaryById(userId, summaryId) {
        const res = await pool.query('SELECT * FROM skill_summaries WHERE id = $1 AND user_id = $2', [summaryId, userId]);
        return res.rows[0] || null;
    }
}
