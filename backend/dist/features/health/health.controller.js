"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = getHealthStatus;
const health_service_js_1 = require("./health.service.js");
async function getHealthStatus(_req, res, next) {
    try {
        const health = await (0, health_service_js_1.checkSystemHealth)();
        res.status(200).json({
            success: true,
            data: health,
        });
    }
    catch (error) {
        next(error);
    }
}
