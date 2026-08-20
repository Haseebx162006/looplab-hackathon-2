import { pool } from '../../db/index.js';

export class TasksService {
  static async submitTask(userId: string, taskId: string, content: string) {
    if (!content || content.trim() === '') {
      throw { status: 400, message: 'Submission content cannot be empty.' };
    }

    // 1. Ownership & Existence Check
    const taskCheck = await pool.query(
      `SELECT t.id, r.user_id, t.status, r.status as roadmap_status
       FROM roadmap_tasks t
       JOIN roadmap_sections s ON t.section_id = s.id
       JOIN roadmaps r ON s.roadmap_id = r.id
       WHERE t.id = $1`,
      [taskId]
    );

    const taskInfo = taskCheck.rows[0];
    if (!taskInfo) {
      throw { status: 404, message: 'Task not found.' };
    }

    if (taskInfo.user_id !== userId) {
      throw { status: 403, message: 'Access denied. This task does not belong to your roadmap.' };
    }

    if (taskInfo.roadmap_status === 'completed' || taskInfo.roadmap_status === 'abandoned') {
      throw { status: 400, message: 'Cannot submit a task for a completed or abandoned roadmap.' };
    }

    // 2. Duplicate Check
    const pendingCheck = await pool.query(
      "SELECT id FROM task_submissions WHERE task_id = $1 AND user_id = $2 AND status = 'pending_review'",
      [taskId, userId]
    );
    if (pendingCheck.rows.length > 0) {
      throw { status: 400, message: 'You already have a submission pending review for this task.' };
    }

    // 3. Save Submission
    const dbClient = await pool.connect();
    try {
      await dbClient.query('BEGIN');

      const submissionRes = await dbClient.query(
        `INSERT INTO task_submissions (task_id, user_id, content, status)
         VALUES ($1, $2, $3, 'pending_review')
         RETURNING *`,
        [taskId, userId, content]
      );
      const submission = submissionRes.rows[0];

      if (taskInfo.status === 'not_started') {
        await dbClient.query(
          "UPDATE roadmap_tasks SET status = 'in_progress' WHERE id = $1",
          [taskId]
        );
      }

      await dbClient.query('COMMIT');
      return submission;
    } catch (err) {
      await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      dbClient.release();
    }
  }

  static async getTaskSubmissions(userId: string, taskId: string) {
    const taskCheck = await pool.query(
      `SELECT t.id, r.user_id
       FROM roadmap_tasks t
       JOIN roadmap_sections s ON t.section_id = s.id
       JOIN roadmaps r ON s.roadmap_id = r.id
       WHERE t.id = $1`,
      [taskId]
    );
    const taskInfo = taskCheck.rows[0];
    if (!taskInfo) {
      throw { status: 404, message: 'Task not found.' };
    }
    if (taskInfo.user_id !== userId) {
      throw { status: 403, message: 'Access denied. This task does not belong to you.' };
    }

    const submissionsRes = await pool.query(
      'SELECT * FROM task_submissions WHERE task_id = $1 AND user_id = $2 ORDER BY created_at DESC',
      [taskId, userId]
    );
    return submissionsRes.rows;
  }
}
