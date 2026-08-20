import { pool } from '../../db/index.js';

export class AdminReviewService {
  static async reviewSubmission(adminId: string, submissionId: string, decision: 'approve' | 'reject', comment: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch submission with lock
      const subRes = await client.query(
        `SELECT s.id, s.task_id, s.user_id as student_id, s.status as submission_status,
                t.section_id, t.title as task_title, r.id as roadmap_id, r.module_id
         FROM task_submissions s
         JOIN roadmap_tasks t ON s.task_id = t.id
         JOIN roadmap_sections sec ON t.section_id = sec.id
         JOIN roadmaps r ON sec.roadmap_id = r.id
         WHERE s.id = $1 FOR UPDATE`,
        [submissionId]
      );
      const submission = subRes.rows[0];
      if (!submission) {
        throw { status: 404, message: 'Task submission not found.' };
      }

      if (submission.submission_status !== 'pending_review') {
        throw { status: 400, message: 'This submission has already been reviewed.' };
      }

      const submissionStatus = decision === 'approve' ? 'approved' : 'rejected';

      // 2. Update submission status
      await client.query(
        'UPDATE task_submissions SET status = $1 WHERE id = $2',
        [submissionStatus, submissionId]
      );

      // 3. Create task review audit record
      await client.query(
        `INSERT INTO task_reviews (submission_id, reviewer_id, decision, comment)
         VALUES ($1, $2, $3, $4)`,
        [submissionId, adminId, decision, comment || null]
      );

      let roadmapCompleted = false;
      let certificate = null;

      if (decision === 'approve') {
        // 4. Update task status to completed
        await client.query(
          "UPDATE roadmap_tasks SET status = 'completed' WHERE id = $1",
          [submission.task_id]
        );

        // 5. Recompute section completion
        const sectionId = submission.section_id;
        const tasksStatsRes = await client.query(
          'SELECT count(*) as total, count(*) FILTER (WHERE status = \'completed\') as completed FROM roadmap_tasks WHERE section_id = $1',
          [sectionId]
        );
        const tasksStats = tasksStatsRes.rows[0];
        const allTasksCompleted = parseInt(tasksStats.total, 10) === parseInt(tasksStats.completed, 10);

        if (allTasksCompleted) {
          // Mark section as completed
          await client.query(
            "UPDATE roadmap_sections SET status = 'completed' WHERE id = $1",
            [sectionId]
          );

          // 6. Recompute roadmap completion
          const roadmapId = submission.roadmap_id;
          const sectionsStatsRes = await client.query(
            'SELECT count(*) as total, count(*) FILTER (WHERE status = \'completed\') as completed FROM roadmap_sections WHERE roadmap_id = $1',
            [roadmapId]
          );
          const sectionsStats = sectionsStatsRes.rows[0];
          const allSectionsCompleted = parseInt(sectionsStats.total, 10) === parseInt(sectionsStats.completed, 10);

          if (allSectionsCompleted) {
            // Mark roadmap as completed
            await client.query(
              "UPDATE roadmaps SET status = 'completed' WHERE id = $1",
              [roadmapId]
            );
            roadmapCompleted = true;

            // 7. Issue Certificate (with duplicate check)
            const certCheck = await client.query(
              'SELECT id FROM certificates WHERE user_id = $1 AND roadmap_id = $2',
              [submission.student_id, roadmapId]
            );
            if (certCheck.rows.length === 0) {
              const certRes = await client.query(
                `INSERT INTO certificates (user_id, roadmap_id, module_id)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [submission.student_id, roadmapId, submission.module_id]
              );
              certificate = certRes.rows[0];
            } else {
              const existingCert = await client.query(
                'SELECT * FROM certificates WHERE user_id = $1 AND roadmap_id = $2',
                [submission.student_id, roadmapId]
              );
              certificate = existingCert.rows[0];
            }
          }
        }
      } else {
        // If rejected, set task status back to in_progress so it can be worked on
        await client.query(
          "UPDATE roadmap_tasks SET status = 'in_progress' WHERE id = $1",
          [submission.task_id]
        );
      }

      await client.query('COMMIT');

      return {
        submission_id: submissionId,
        decision,
        status: submissionStatus,
        roadmap_completed: roadmapCompleted,
        certificate
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getSubmissionsForReview() {
    const res = await pool.query(
      `SELECT s.*, t.title as task_title, u.name as student_name, u.email as student_email
       FROM task_submissions s
       JOIN roadmap_tasks t ON s.task_id = t.id
       JOIN users u ON s.user_id = u.id
       WHERE s.status = 'pending_review'
       ORDER BY s.created_at ASC`
    );
    return res.rows;
  }
}
