'use client';

import { useState, useEffect } from 'react';
import { KnowledgeChunk, RagQueryResult } from '../types/rag';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function RagDemo() {
  const [activeTab, setActiveTab] = useState<'ingest' | 'query' | 'store'>('query');

  // Ingest state
  const [ingestText, setIngestText] = useState('');
  const [fileName, setFileName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestMsg, setIngestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Query state
  const [queryText, setQueryText] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<RagQueryResult | null>(null);

  // Store state
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);

  const fetchChunks = async () => {
    try {
      setStoreLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/rag/chunks?mentorId=default_mentor`);
      const data = await res.json();
      if (data.chunks) {
        setChunks(data.chunks);
      }
    } catch {
      // Backend off or disconnected
    } finally {
      setStoreLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'store') {
      fetchChunks();
    }
  }, [activeTab]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestText.trim()) return;

    try {
      setIngestLoading(true);
      setIngestMsg(null);

      const res = await fetch(`${BACKEND_URL}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: 'default_mentor',
          text: ingestText,
          fileName: fileName || 'document.txt',
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIngestMsg({
          type: 'success',
          text: `Success! Ingested ${data.ingestedCount} vector chunks into pgvector store.`,
        });
        setIngestText('');
        setFileName('');
      } else {
        setIngestMsg({ type: 'error', text: data.error || 'Ingestion failed' });
      }
    } catch {
      setIngestMsg({ type: 'error', text: 'Error connecting to backend server' });
    } finally {
      setIngestLoading(false);
    }
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    try {
      setQueryLoading(true);
      setQueryResult(null);

      const res = await fetch(`${BACKEND_URL}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: 'default_mentor',
          query: queryText,
          apiKey: apiKey.trim() || undefined,
          generateAnswer: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQueryResult(data);
      } else {
        alert(data.error || 'Query failed');
      }
    } catch {
      alert('Error connecting to backend server');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDeleteChunk = async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/chunks/${id}?mentorId=default_mentor`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChunks(chunks.filter((c) => c.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl col-span-1 md:col-span-2 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-1">
            🧠 Hybrid RAG Pipeline (pgvector + Full-Text Search + RRF)
          </div>
          <h2 className="text-xl font-extrabold text-white">Retrieval-Augmented Generation Suite</h2>
          <p className="text-xs text-slate-400">
            Ingest custom knowledge documents, perform hybrid vector retrieval, and get grounded AI answers.
          </p>
        </div>

        {/* Optional API Key Input */}
        <div className="w-full sm:w-64">
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Optional Gemini API Key
          </label>
          <input
            type="password"
            placeholder="AIzaSy... (Optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-sm font-medium gap-6">
        <button
          onClick={() => setActiveTab('query')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'query' ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔍 Grounded QA Search
          {activeTab === 'query' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('ingest')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'ingest' ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📥 Ingest Knowledge
          {activeTab === 'ingest' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`pb-3 transition-colors relative ${
            activeTab === 'store' ? 'text-violet-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📚 Vector Knowledge Store
          {activeTab === 'store' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />}
        </button>
      </div>

      {/* Tab 1: Grounded QA Search */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          <form onSubmit={handleQuery} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question grounded in your ingested knowledge base..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={queryLoading}
              className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-600/20"
            >
              {queryLoading ? 'Searching...' : 'Ask RAG'}
            </button>
          </form>

          {/* Query Results Display */}
          {queryResult && (
            <div className="space-y-4">
              {/* Answer Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-violet-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-300 flex items-center gap-1.5">
                    🤖 AI Grounded Response
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Confidence:</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        queryResult.confidenceScore > 0.7
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {Math.round(queryResult.confidenceScore * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-sans">{queryResult.answer}</p>
              </div>

              {/* Source Citations */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Retrieved Source Snippets ({queryResult.chunks.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queryResult.chunks.map((chunk, idx) => (
                    <div
                      key={chunk.id}
                      className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-mono text-violet-400 font-semibold">Chunk #{idx + 1}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800">
                          Score: {chunk.score ? chunk.score.toFixed(3) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-slate-300 line-clamp-4 leading-relaxed font-mono text-[11px]">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Ingest Knowledge */}
      {activeTab === 'ingest' && (
        <form onSubmit={handleIngest} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Document Title / File Name</label>
            <input
              type="text"
              placeholder="e.g. system-architecture-guide.txt"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Document Content (Text)</label>
            <textarea
              rows={6}
              placeholder="Paste your knowledge base content, guidelines, documentation, or rules here..."
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          {ingestMsg && (
            <div
              className={`p-3 rounded-lg text-xs ${
                ingestMsg.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}
            >
              {ingestMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={ingestLoading}
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-md shadow-violet-600/20"
          >
            {ingestLoading ? 'Ingesting & Embedding...' : 'Ingest & Store Embeddings'}
          </button>
        </form>
      )}

      {/* Tab 3: Knowledge Store */}
      {activeTab === 'store' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Total Chunks Stored: {chunks.length}</span>
            <button
              onClick={fetchChunks}
              className="text-xs text-violet-400 hover:underline font-mono"
            >
              🔄 Refresh
            </button>
          </div>

          {storeLoading ? (
            <div className="text-xs text-slate-400 py-4">Loading vector chunks...</div>
          ) : chunks.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-lg">
              No knowledge chunks stored yet. Use the "Ingest Knowledge" tab to add documents.
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {chunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex justify-between gap-4 items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-violet-400 font-semibold">
                        Index #{chunk.chunkIndex}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {chunk.sourceType}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{chunk.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteChunk(chunk.id)}
                    className="text-rose-400 hover:text-rose-300 text-[11px] font-mono px-2 py-1 rounded bg-rose-950/40 border border-rose-900/40"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
