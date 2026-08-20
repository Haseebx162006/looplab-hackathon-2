import { pool } from '../db/index.js';
export async function requireAdmin(req, res, next) {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized. Login required.' });
    }
    try {
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const user = userRes.rows[0];
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
