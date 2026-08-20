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
    } else {
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { message: text };
      }
    }

    res.status(response.status).json(responseData);
  } catch (error) {
    console.error(`[RAG Proxy Error] Failed to forward request to RAG-Service:`, error.message);
    next(error);
  }
}

export async function handleIngest(req, res, next) {
  await proxyRequest(req, res, next, '/api/rag/ingest', 'POST');
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
