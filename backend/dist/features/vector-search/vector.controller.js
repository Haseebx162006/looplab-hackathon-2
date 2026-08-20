"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInsertVector = handleInsertVector;
exports.handleSearchVector = handleSearchVector;
const vector_service_js_1 = require("./vector.service.js");
async function handleInsertVector(req, res, next) {
    try {
        const { title, content, embedding } = req.body;
        if (!title || !content || !Array.isArray(embedding)) {
            res.status(400).json({
                success: false,
                error: 'Invalid input. Please provide title, content, and an embedding array.',
            });
            return;
        }
        await (0, vector_service_js_1.createItemsTableIfNotExists)(embedding.length);
        const item = await (0, vector_service_js_1.insertVectorDocument)({ title, content, embedding });
        res.status(201).json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
}
async function handleSearchVector(req, res, next) {
    try {
        const { vector, limit } = req.body;
        if (!Array.isArray(vector)) {
            res.status(400).json({
                success: false,
                error: 'Invalid query vector array.',
            });
            return;
        }
        const results = await (0, vector_service_js_1.searchSimilarVectors)(vector, limit ? parseInt(String(limit), 10) : 5);
        res.status(200).json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        next(error);
    }
}
