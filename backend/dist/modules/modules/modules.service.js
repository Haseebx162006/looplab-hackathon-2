import { pool } from '../../db/index.js';
export class ModulesService {
    static async listModules() {
        const res = await pool.query('SELECT id, name, description FROM modules ORDER BY name ASC');
        return res.rows;
    }
    static async getModuleById(id) {
        const res = await pool.query('SELECT * FROM modules WHERE id = $1', [id]);
        return res.rows[0] || null;
    }
}
