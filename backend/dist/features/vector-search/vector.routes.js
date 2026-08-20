"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vector_controller_js_1 = require("./vector.controller.js");
const router = (0, express_1.Router)();
router.post('/items', vector_controller_js_1.handleInsertVector);
router.post('/search', vector_controller_js_1.handleSearchVector);
exports.default = router;
