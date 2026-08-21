import { extractCvText } from '../../modules/cv-analyze/extract-cv-text.js';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:5002';
async function proxyRequest(req, res, next, path, method = 'GET') {
    try {
        const url = new URL(`${RAG_SERVICE_URL}${path}`);
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (req.query[key] !== undefined) {
                    url.searchParams.append(key, String(req.query[key]));
                }
            });
        }
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        if (method !== 'GET' && method !== 'HEAD' && req.body) {
            options.body = JSON.stringify(req.body);
        }
        const response = await fetch(url.toString(), options);
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        }
        else {
            const text = await response.text();
            try {
                responseData = JSON.parse(text);
            }
            catch {
                responseData = { message: text };
            }
        }
        res.status(response.status).json(responseData);
    }
    catch (error) {
        console.error(`[RAG Proxy Error] Failed to forward request to RAG-Service:`, error.message);
        next(error);
    }
}
export async function handleIngest(req, res, next) {
    try {
        const { file, text, ...rest } = req.body;
        let textToIngest = text;
        if (file) {
            console.log(`[RAG Ingest Debug] file string length: ${file.length}, prefix: "${file.substring(0, 100)}"`);
            const match = file.match(/^data:.*?;base64,(.+)$/s);
            const b64 = match ? match[1] : file;
            const cleanB64 = b64.replace(/ /g, '+').replace(/\s/g, '');
            if (!cleanB64.startsWith('JVBER')) {
                res.status(422).json({ error: 'Invalid file format: The file uploaded is not a valid PDF document.' });
                return;
            }
            textToIngest = await extractCvText(file);
            if (!textToIngest || textToIngest.length < 10) {
                res.status(422).json({ error: 'Could not extract valid text from the uploaded PDF.' });
                return;
            }
        }
        req.body = {
            ...rest,
            text: textToIngest,
        };
        await proxyRequest(req, res, next, '/api/rag/ingest', 'POST');
    }
    catch (error) {
        console.error(`[RAG Ingest Error] Failed to extract PDF text or proxy request:`, error.message);
        next(error);
    }
}
export async function handleQuery(req, res, next) {
    await proxyRequest(req, res, next, '/api/rag/query', 'POST');
}
export async function handleListChunks(req, res, next) {
    await proxyRequest(req, res, next, '/api/rag/chunks', 'GET');
}
export async function handleDeleteChunk(req, res, next) {
    await proxyRequest(req, res, next, `/api/rag/chunks/${req.params.id}`, 'DELETE');
}
export async function handleListDrafts(req, res, next) {
    await proxyRequest(req, res, next, '/api/rag/drafts', 'GET');
}
export async function handleListDocuments(req, res, next) {
    await proxyRequest(req, res, next, '/api/rag/documents', 'GET');
}
export async function handleDeleteDocument(req, res, next) {
    await proxyRequest(req, res, next, `/api/rag/documents/${req.params.id}`, 'DELETE');
}
