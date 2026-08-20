export async function generateResponse({ systemPrompt, userPrompt, apiKey, model = 'gemini-1.5-flash', }) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (key) {
        try {
            return await fetchGeminiGeneration(systemPrompt, userPrompt, key, model);
        }
        catch (error) {
            console.warn('⚠️ LLM Generation API call failed, using fallback generator:', error.message);
        }
    }
    return generateFallbackResponse(systemPrompt, userPrompt);
}
async function fetchGeminiGeneration(systemPrompt, userPrompt, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: systemPrompt }],
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: userPrompt }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
            },
        }),
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Generation API Error (${response.status}): ${errText}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error('Empty response from Gemini API');
    }
    return text.trim();
}
function generateFallbackResponse(systemPrompt, userPrompt) {
    const match = systemPrompt.match(/KNOWLEDGE BASE:\n([\s\S]*)/);
    const context = match ? match[1].trim() : '';
    if (!context || context.includes('(No context retrieved)')) {
        return "I don't have enough information in my knowledge base to answer that.";
    }
    const cleanSnippet = context.replace(/\[Doc Chunk #\d+\]/g, '').trim().slice(0, 300);
    return `Based on the knowledge base: "${cleanSnippet}..."`;
}
