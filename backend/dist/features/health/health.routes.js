"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_js_1 = require("./health.controller.js");
const router = (0, express_1.Router)();
router.get('/health', health_controller_js_1.getHealthStatus);
exports.default = router;
