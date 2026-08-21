import { pool } from '../../db/index.js';
import { config } from '../../config/env.js';
export class RoadmapsService {
    static async generateRoadmap(userId, skillSummaryId) {
        // 1. Verify skill summary exists and belongs to user
        const summaryRes = await pool.query('SELECT * FROM skill_summaries WHERE id = $1 AND user_id = $2', [skillSummaryId, userId]);
        const skillSummary = summaryRes.rows[0];
        if (!skillSummary) {
            throw { status: 404, message: 'Skill summary not found or does not belong to you.' };
        }
        // Check if roadmap already exists for this skill summary
        const existingRoadmapRes = await pool.query('SELECT * FROM roadmaps WHERE skill_summary_id = $1 AND user_id = $2', [skillSummaryId, userId]);
        if (existingRoadmapRes.rows[0]) {
            return existingRoadmapRes.rows[0];
        }
        // 2. Archive any existing active roadmap in progress
        await pool.query("UPDATE roadmaps SET status = 'abandoned' WHERE user_id = $1 AND status = 'in_progress'", [userId]);
        // 3. Fetch module name, profile and test questions/answers
        const moduleRes = await pool.query('SELECT name FROM modules WHERE id = $1', [skillSummary.module_id]);
        const moduleItem = moduleRes.rows[0];
        const moduleName = moduleItem ? moduleItem.name : 'AI Engineering';
        const profileRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0];
        if (!profile) {
            throw { status: 400, message: 'Profile is incomplete.' };
        }
        const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        // Fetch test details for score
        const testRes = await pool.query('SELECT score FROM tests WHERE id = $1', [skillSummary.test_id]);
        const test = testRes.rows[0];
        const questionsRes = await pool.query('SELECT question, correct_answer, student_answer FROM test_questions WHERE test_id = $1', [skillSummary.test_id]);
        const questions = questionsRes.rows;
        const assessment_results = questions.map(q => ({
            question: q.question,
            answer: q.student_answer || '',
            correct_answer: q.correct_answer,
            is_correct: (q.student_answer || '').trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()
        }));
        // 4. Call AI Agent Service
        let roadmapData;
        try {
            const response = await fetch(`${config.aiAgentServiceUrl}/agent/generate-roadmap`, {
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
                    career_goal: `${moduleName}${profile.career_goal ? ` (aligned with career aspiration: ${profile.career_goal})` : ''}`,
                    test_score: test ? (test.score || 0) : 0
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI Service error: ${response.status} - ${errorText}`);
            }
            roadmapData = await response.json();
        }
        catch (error) {
            console.error('Failed to call AI Agent Service for roadmap generation:', error);
            throw { status: 502, message: `AI Agent Service call failed: ${error.message || error}` };
        }
        if (!roadmapData || !roadmapData.modules || !Array.isArray(roadmapData.modules)) {
            throw { status: 500, message: 'AI Agent Service returned invalid roadmap data.' };
        }
        // 5. Store in DB inside a Transaction
        const dbClient = await pool.connect();
        try {
            await dbClient.query('BEGIN');
            const roadmapInsert = await dbClient.query(`INSERT INTO roadmaps (user_id, module_id, skill_summary_id, status)
         VALUES ($1, $2, $3, 'in_progress')
         RETURNING *`, [userId, skillSummary.module_id, skillSummaryId]);
            const roadmap = roadmapInsert.rows[0];
            for (let i = 0; i < roadmapData.modules.length; i++) {
                const sec = roadmapData.modules[i];
                const secRes = await dbClient.query(`INSERT INTO roadmap_sections (roadmap_id, title, "order", status)
           VALUES ($1, $2, $3, 'in_progress')
           RETURNING *`, [roadmap.id, sec.title || `Section ${i + 1}`, sec.module_number || (i + 1)]);
                const section = secRes.rows[0];
                const tasksList = sec.tasks || [];
                for (let j = 0; j < tasksList.length; j++) {
                    const taskTitle = tasksList[j];
                    await dbClient.query(`INSERT INTO roadmap_tasks (section_id, title, description, "order", status)
             VALUES ($1, $2, $3, $4, 'not_started')`, [
                        section.id,
                        taskTitle,
                        `Complete learning tasks for: ${taskTitle}. Skills covered: ${(sec.skills_covered || []).join(', ')}`,
                        j + 1
                    ]);
                }
                if (sec.project && sec.project.name) {
                    await dbClient.query(`INSERT INTO roadmap_tasks (section_id, title, description, "order", status)
             VALUES ($1, $2, $3, $4, 'not_started')`, [
                        section.id,
                        `Project: ${sec.project.name}`,
                        sec.project.description,
                        tasksList.length + 1
                    ]);
                }
            }
            await dbClient.query('COMMIT');
            return roadmap;
        }
        catch (err) {
            await dbClient.query('ROLLBACK');
            throw err;
        }
        finally {
            dbClient.release();
        }
    }
    static async getRoadmapById(userId, roadmapId) {
        const roadmapRes = await pool.query('SELECT * FROM roadmaps WHERE id = $1 AND user_id = $2', [roadmapId, userId]);
        const roadmap = roadmapRes.rows[0];
        if (!roadmap) {
            return null;
        }
        const sectionsRes = await pool.query('SELECT * FROM roadmap_sections WHERE roadmap_id = $1 ORDER BY "order" ASC', [roadmapId]);
        const sections = sectionsRes.rows;
        for (const section of sections) {
            const tasksRes = await pool.query('SELECT * FROM roadmap_tasks WHERE section_id = $1 ORDER BY "order" ASC', [section.id]);
            section.tasks = tasksRes.rows;
        }
        return {
            ...roadmap,
            sections
        };
    }
    static async abandonRoadmap(userId, roadmapId) {
        const res = await pool.query("UPDATE roadmaps SET status = 'abandoned' WHERE id = $1 AND user_id = $2 AND status = 'in_progress' RETURNING *", [roadmapId, userId]);
        if (res.rows.length === 0) {
            throw { status: 400, message: 'No active roadmap found to abandon.' };
        }
        return res.rows[0];
    }
    static async resumeRoadmap(userId, roadmapId) {
        // 1. Verify no other roadmap is in_progress
        const activeRes = await pool.query("SELECT id FROM roadmaps WHERE user_id = $1 AND status = 'in_progress'", [userId]);
        if (activeRes.rows.length > 0) {
            throw { status: 400, message: 'You already have another active roadmap. Complete or abandon it first.' };
        }
        // 2. Resume the roadmap
        const res = await pool.query("UPDATE roadmaps SET status = 'in_progress' WHERE id = $1 AND user_id = $2 AND status = 'abandoned' RETURNING *", [roadmapId, userId]);
        if (res.rows.length === 0) {
            throw { status: 404, message: 'Roadmap not found or cannot be resumed.' };
        }
        return res.rows[0];
    }
}
