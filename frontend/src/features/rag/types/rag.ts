export interface KnowledgeChunk {
  id: string;
  mentorId: string;
  menteeId?: string | null;
  sourceType: string;
  sourceId?: string | null;
  chunkIndex: number;
  content: string;
  visibility: string;
  score?: number;
  createdAt?: string;
}

export interface RagQueryResult {
  answer?: string;
  confidenceScore: number;
  chunks: KnowledgeChunk[];
  abstained: boolean;
}
