import { pool } from '../../db/index.js';
import { config } from '../../config/env.js';
export class TestsService {
    static async generateTest(userId, input) {
        const { module_id, difficulty } = input;
        // 1. Verify if user profile is complete and extract properties
        const profileRes = await pool.query('SELECT profile_complete, skills, experience FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0];
        if (!profile || !profile.profile_complete) {
            throw { status: 400, message: 'Profile is incomplete. Please complete your onboarding profile first.' };
        }
        // 2. Auto-abandon any existing active roadmaps
        await pool.query("UPDATE roadmaps SET status = 'abandoned' WHERE user_id = $1 AND status = 'in_progress'", [userId]);
        // 3. Fetch module name
        const moduleRes = await pool.query('SELECT name FROM modules WHERE id = $1', [module_id]);
        const moduleItem = moduleRes.rows[0];
        if (!moduleItem) {
            throw { status: 404, message: 'Selectable module not found.' };
        }
        // 4. Call AI Agent Service
        let questions = [];
        try {
            const response = await fetch(`${config.aiAgentServiceUrl}/agent/generate-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    module: moduleItem.name,
                    difficulty: difficulty,
                    skills: profile.skills || [],
                    experience: profile.experience || null
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI Service error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            questions = data.questions;
        }
        catch (error) {
            console.error('Failed to call AI Agent Service for test generation:', error);
            throw { status: 502, message: `AI Agent Service call failed: ${error.message || error}` };
        }
        if (!questions || questions.length === 0) {
            throw { status: 500, message: 'AI Agent Service failed to return test questions.' };
        }
        // 5. Store in DB using a Transaction
        const dbClient = await pool.connect();
        try {
            await dbClient.query('BEGIN');
            const testRes = await dbClient.query(`INSERT INTO tests (user_id, module_id, difficulty, status)
         VALUES ($1, $2, $3, 'in_progress')
         RETURNING *`, [userId, module_id, difficulty]);
            const test = testRes.rows[0];
            const questionPromises = questions.map((q) => {
                return dbClient.query(`INSERT INTO test_questions (test_id, question, options, correct_answer)
           VALUES ($1, $2, $3, $4)
           RETURNING id, question, options`, [test.id, q.question, q.options, q.correct_answer]);
            });
            const questionResults = await Promise.all(questionPromises);
            const insertedQuestions = questionResults.map(res => res.rows[0]);
            await dbClient.query('COMMIT');
            return {
                test_id: test.id,
                module_id: test.module_id,
                difficulty: test.difficulty,
                status: test.status,
                questions: insertedQuestions
            };
        }
        catch (dbError) {
            await dbClient.query('ROLLBACK');
            throw dbError;
        }
        finally {
            dbClient.release();
        }
    }
    static async submitTest(userId, testId, answers) {
        const dbClient = await pool.connect();
        try {
            await dbClient.query('BEGIN');
            // 1. Fetch test
            const testRes = await dbClient.query('SELECT * FROM tests WHERE id = $1 AND user_id = $2 FOR UPDATE', [testId, userId]);
            const test = testRes.rows[0];
            if (!test) {
                throw { status: 404, message: 'Test not found or does not belong to you.' };
            }
            if (test.status === 'completed') {
                throw { status: 400, message: 'Test has already been submitted and scored.' };
            }
            // 2. Fetch test questions
            const questionsRes = await dbClient.query('SELECT id, correct_answer FROM test_questions WHERE test_id = $1', [testId]);
            const dbQuestions = questionsRes.rows;
            // 3. Score the test and save answers
            let correctCount = 0;
            const answerMap = new Map(answers.map(a => [a.question_id, a.selected_answer]));
            for (const q of dbQuestions) {
                const studentAnswer = answerMap.get(q.id) || null;
                if (studentAnswer && studentAnswer.trim() === q.correct_answer.trim()) {
                    correctCount++;
                }
                // Save student answer to DB
                await dbClient.query('UPDATE test_questions SET student_answer = $1 WHERE id = $2', [studentAnswer, q.id]);
            }
            const totalQuestions = dbQuestions.length;
            const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
            // 4. Update test in DB
            await dbClient.query("UPDATE tests SET status = 'completed', score = $1 WHERE id = $2", [score, testId]);
            await dbClient.query('COMMIT');
            return {
                test_id: testId,
                score,
                total_questions: totalQuestions,
                correct_answers: correctCount,
                status: 'completed'
            };
        }
        catch (error) {
            await dbClient.query('ROLLBACK');
            throw error;
        }
        finally {
            dbClient.release();
        }
    }
    static async getTestById(userId, testId) {
        const testRes = await pool.query('SELECT * FROM tests WHERE id = $1 AND user_id = $2', [testId, userId]);
        const test = testRes.rows[0];
        if (!test) {
            return null;
        }
        const questionsRes = await pool.query('SELECT id, question, options FROM test_questions WHERE test_id = $1', [testId]);
        return {
            ...test,
            questions: questionsRes.rows
        };
    }
    static async getTestHistory(userId) {
        const res = await pool.query(`SELECT
         t.id,
         t.difficulty,
         t.status,
         t.score,
         t.created_at,
         m.name AS module_name,
         (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) AS total_questions
       FROM tests t
       LEFT JOIN modules m ON t.module_id = m.id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`, [userId]);
        return res.rows;
    }
}
