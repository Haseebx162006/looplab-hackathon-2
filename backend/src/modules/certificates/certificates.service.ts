import { pool } from '../../db/index.js';

export class CertificatesService {
  static async getCertificateDetails(userId: string, certificateId: string) {
    const query = `
      SELECT c.id, c.user_id, c.roadmap_id, c.module_id, c.issued_at, c.title, c.message, c.style,
             u.name as student_name, u.email as student_email,
             m.name as module_name
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN modules m ON c.module_id = m.id
      WHERE c.id = $1
    `;
    const res = await pool.query(query, [certificateId]);
    const cert = res.rows[0];

    if (!cert) {
      return null;
    }

    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const loggedInUser = userRes.rows[0];
    const isAdmin = loggedInUser && loggedInUser.role === 'admin';

    if (cert.user_id !== userId && !isAdmin) {
      throw { status: 403, message: 'Access denied. You cannot view this certificate.' };
    }

    return cert;
  }

  static async issueCertificate(userIds: string[], title: string, message: string, style: string) {
    const results = [];
    for (const userId of userIds) {
      const query = `
        INSERT INTO certificates (user_id, title, message, style)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, title, message, style, issued_at
      `;
      const res = await pool.query(query, [userId, title, message, style]);
      results.push(res.rows[0]);
    }
    return results;
  }
}
