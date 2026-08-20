import { ragConfig } from '../rag.config.js';

export async function embedText(text, apiKey) {
  const [embedding] = await embedTexts([text], apiKey);
  return embedding;
}

export async function embedTexts(texts, apiKey) {
  if (!texts || texts.length === 0) return [];

  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (key) {
    try {
      return await fetchGeminiEmbeddings(texts, key);
    } catch (error) {
      console.warn('⚠️ Gemini embedding call failed, using fallback vector generator:', error.message);
    }
  }

  return texts.map((t) => generateFallbackEmbedding(t, ragConfig.embedding.dimensions));
}

async function fetchGeminiEmbeddings(texts, apiKey) {
  const { model, dimensions, batchSize } = ragConfig.embedding;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents`;

    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: batch.map((t) => ({
          model: `models/${model}`,
          content: { parts: [{ text: t }] },
          outputDimensionality: dimensions,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Embedding API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (data.embeddings && Array.isArray(data.embeddings)) {
      for (const e of data.embeddings) {
        allEmbeddings.push(e.values);
      }
    } else {
      throw new Error('Invalid embedding response format');
    }
  }

  return allEmbeddings;
}

function generateFallbackEmbedding(text, dimensions = 768) {
  const vec = new Array(dimensions).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let d = 0; d < dimensions; d++) {
    const seed = Math.sin(hash + d) * 10000;
    vec[d] = seed - Math.floor(seed);
  }
  const norm = Math.sqrt(vec.reduce((acc, val) => acc + val * val, 0)) || 1;
  return vec.map((val) => val / norm);
}
