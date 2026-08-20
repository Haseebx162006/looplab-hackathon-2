import { insertVectorItem, searchSimilarVectors } from './vector.service.js';
export async function handleInsertItem(req, res, next) {
    try {
        const { title, content, vector } = req.body;
        if (!title || !content || !Array.isArray(vector)) {
            res.status(400).json({ success: false, error: 'Missing title, content, or vector array' });
            return;
        }
        const item = await insertVectorItem({ title, content, vector });
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        next(error);
    }
}
export async function handleSearchVector(req, res, next) {
    try {
        const { vector, limit = 5 } = req.body;
        if (!Array.isArray(vector)) {
            res.status(400).json({ success: false, error: 'Vector array is required for search' });
            return;
        }
        const results = await searchSimilarVectors(vector, limit);
        res.json({ success: true, data: results });
    }
    catch (error) {
        next(error);
    }
}
