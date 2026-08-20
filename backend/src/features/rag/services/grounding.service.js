export function scoreGrounding(response, chunks) {
  if (!response || !chunks || chunks.length === 0) return 0.0;

  if (response.includes("don't have enough information")) return 0.1;

  const responseWords = new Set(
    response.toLowerCase().match(/\w+/g) || []
  );

  let maxChunkMatchRatio = 0;

  for (const chunk of chunks) {
    const chunkWords = chunk.content.toLowerCase().match(/\w+/g) || [];
    if (chunkWords.length === 0) continue;

    let matched = 0;
    for (const w of chunkWords) {
      if (responseWords.has(w)) matched++;
    }

    const ratio = matched / chunkWords.length;
    if (ratio > maxChunkMatchRatio) {
      maxChunkMatchRatio = ratio;
    }
  }

  const topVectorScore = chunks[0]?.score || 0.7;
  const confidence = Math.min(1.0, topVectorScore * 0.5 + maxChunkMatchRatio * 0.5 + 0.2);

  return parseFloat(confidence.toFixed(2));
}
