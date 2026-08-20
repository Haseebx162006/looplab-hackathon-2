export function buildPrompt({ chunks, styleProfile, recentTurns = [], query, }) {
    const formattedContext = chunks
        .map((chunk, index) => `[Doc Chunk #${index + 1}]\n${chunk.content}`)
        .join('\n\n');
    const brevity = styleProfile?.tone?.brevity ?? 0.5;
    const formality = styleProfile?.tone?.formality ?? 0.5;
    const lengthInstruction = brevity > 0.7 ? 'Be very concise and direct.' : brevity < 0.3 ? 'Provide detailed explanations.' : 'Keep responses balanced and informative.';
    const toneInstruction = formality > 0.7 ? 'Use formal and professional tone.' : formality < 0.3 ? 'Use casual, friendly, and conversational tone.' : 'Use professional yet approachable tone.';
    const systemPrompt = `You are an AI Assistant providing answers strictly grounded in the provided Knowledge Base context.

STYLE GUIDELINES:
- ${lengthInstruction}
- ${toneInstruction}

CRITICAL GROUNDING RULES:
1. Base your answer strictly on the Knowledge Base snippets below.
2. Do not invent or extrapolate facts not supported by the context.
3. If the context does not contain enough information to answer the question, state: "I don't have enough information in my knowledge base to answer that."

KNOWLEDGE BASE:
${formattedContext || '(No context retrieved)'}`;
    const conversationHistory = recentTurns.length
        ? `CONVERSATION HISTORY:\n` + recentTurns.map((t) => `${t.role}: ${t.text}`).join('\n') + `\n\n`
        : '';
    const userPrompt = `${conversationHistory}USER QUESTION:\n${query}`;
    return { systemPrompt, userPrompt };
}
