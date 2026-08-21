import { RagService } from './services/rag.service.js';

export async function handleIngest(req, res, next) {
  try {
    const { mentorId = 'default_mentor', menteeId, text, fileName, sourceType, visibility, apiKey } = req.body;

    if (!text) {
      res.status(400).json({ error: 'Text field is required for ingestion' });
      return;
    }

    const result = await RagService.ingest({
      mentorId,
      menteeId,
      text,
      fileName,
      sourceType,
      visibility,
      apiKey,
    });

    res.status(201).json({
      message: 'Document ingested successfully into vector store',
      ingestedCount: result.ingestedCount,
      chunks: result.chunks,
    });
  } catch (error) {
    next(error);
  }
}

export async function handleQuery(req, res, next) {
  try {
    const { query, mentorId = 'default_mentor', menteeId, apiKey, generateAnswer = true } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    const result = await RagService.query({
      query,
      mentorId,
      menteeId,
      apiKey,
      generateAnswer,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function handleListChunks(req, res, next) {
  try {
    const mentorId = req.query.mentorId || 'default_mentor';
    const chunks = await RagService.listChunks(mentorId);
    res.json({ chunks, count: chunks.length });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteChunk(req, res, next) {
  try {
    const { id } = req.params;
    const mentorId = req.query.mentorId || 'default_mentor';

    const deleted = await RagService.deleteChunk(id, mentorId);
    if (!deleted) {
      res.status(404).json({ error: 'Chunk not found or unauthorized' });
      return;
    }

    res.json({ message: 'Chunk deleted successfully', id });
  } catch (error) {
    next(error);
  }
}

export async function handleListDrafts(req, res, next) {
  try {
    const mentorId = req.query.mentorId || 'default_mentor';
    const drafts = await RagService.listDrafts(mentorId);
    res.json({ drafts });
  } catch (error) {
    next(error);
  }
}

export async function handleListDocuments(req, res, next) {
  try {
    const mentorId = req.query.mentorId;
    if (!mentorId) {
      res.status(400).json({ error: 'mentorId is required' });
      return;
    }
    const documents = await RagService.listDocuments(mentorId);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const mentorId = req.query.mentorId;
    if (!mentorId) {
      res.status(400).json({ error: 'mentorId is required' });
      return;
    }

    const deleted = await RagService.deleteDocument(id, mentorId);
    if (!deleted) {
      res.status(404).json({ error: 'Document not found or unauthorized' });
      return;
    }

    res.json({ message: 'Document and its chunks deleted successfully', id });
  } catch (error) {
    next(error);
  }
}
