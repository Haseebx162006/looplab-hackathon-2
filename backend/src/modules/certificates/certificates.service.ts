import { pool } from '../../db/index.js';

export class CertificatesService {
  static async getCertificateDetails(userId: string, certificateId: string) {
    const query = `
      SELECT c.id, c.user_id, c.roadmap_id, c.module_id, c.issued_at,
             u.name as student_name, u.email as student_email,
             m.name as module_name
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN modules m ON c.module_id = m.id
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
}
