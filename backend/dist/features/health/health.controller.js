import { checkHealth } from './health.service.js';
export async function getHealthStatus(_req, res, next) {
    try {
        const health = await checkHealth();
        res.json(health);
    }
    catch (error) {
        next(error);
    }
}
