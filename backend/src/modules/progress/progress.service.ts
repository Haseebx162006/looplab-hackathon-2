import { pool } from '../../db/index.js';

export class ProgressService {
  static async getProgressSummary(userId: string) {
    // 1. Fetch all roadmaps for this user
    const roadmapsRes = await pool.query(
      `SELECT r.id as roadmap_id, r.status, r.created_at, m.name as module_name
       FROM roadmaps r
       JOIN modules m ON r.module_id = m.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    const roadmaps = roadmapsRes.rows;

    const roadmapSummaries = [];

    for (const r of roadmaps) {
      const statsRes = await pool.query(
        `SELECT count(t.id) as total,
                count(t.id) FILTER (WHERE t.status = 'completed') as completed
         FROM roadmap_tasks t
         JOIN roadmap_sections s ON t.section_id = s.id
         WHERE s.roadmap_id = $1`,
        [r.roadmap_id]
      );
      const stats = statsRes.rows[0];
      const total = parseInt(stats.total, 10) || 0;
      const completed = parseInt(stats.completed, 10) || 0;
      const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

      roadmapSummaries.push({
        roadmap_id: r.roadmap_id,
        module_name: r.module_name,
        status: r.status,
        created_at: r.created_at,
        tasks_total: total,
        tasks_completed: completed,
        progress_percentage: progressPercent
      });
    }

    // 2. Fetch certificates
    const certsRes = await pool.query(
      `SELECT c.id as certificate_id, c.issued_at, COALESCE(c.title, m.name) as module_name, c.message, c.style
       FROM certificates c
       LEFT JOIN modules m ON c.module_id = m.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [userId]
    );

    return {
      roadmaps: roadmapSummaries,
      certificates: certsRes.rows
    };
  }
}
