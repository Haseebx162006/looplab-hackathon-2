import { ragConfig } from '../rag.config.js';
export function chunkText(text, customChunkSize, customOverlap) {
    const chunkSize = customChunkSize || ragConfig.chunking.chunkSize;
    const overlap = customOverlap || ragConfig.chunking.overlap;
    if (!text || text.trim().length === 0)
        return [];
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = start + chunkSize;
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks.filter((c) => c.trim().length > 10);
}
