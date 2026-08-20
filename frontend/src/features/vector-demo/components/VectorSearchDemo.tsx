'use client';

import { useState } from 'react';
import { VectorSearchResult } from '../types/vector';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function VectorSearchDemo() {
  const [vectorInput, setVectorInput] = useState('[0.1, 0.5, 0.9]');
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async () => {
    try {
      setLoading(true);
      setMessage('');
      const parsedVector = JSON.parse(vectorInput);

      const res = await fetch(`${BACKEND_URL}/api/vector/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vector: parsedVector }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      } else {
        setMessage(data.error || 'Search failed');
      }
    } catch {
      setMessage('Ensure backend server is running and database is connected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-2">⚡ pgvector Cosine Search Demo</h3>
      <p className="text-slate-400 text-xs mb-4">
        Test high-dimensional vector similarity queries using PostgreSQL + pgvector.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={vectorInput}
          onChange={(e) => setVectorInput(e.target.value)}
          placeholder="[0.1, 0.5, 0.9]"
          className="flex-1 px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
        >
          {loading ? 'Searching...' : 'Search Vector'}
        </button>
      </div>

      {message && <div className="text-amber-400 text-xs mb-3">{message}</div>}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((item) => (
            <div key={item.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300 font-semibold mb-1">
                <span>{item.title}</span>
                <span className="font-mono text-indigo-400">Distance: {item.distance.toFixed(4)}</span>
              </div>
              <p className="text-slate-400">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
