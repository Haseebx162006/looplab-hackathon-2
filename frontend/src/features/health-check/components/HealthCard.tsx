'use client';

import { useEffect, useState } from 'react';
import { getHealthStatus } from '../api/getHealthStatus';
import { HealthResponse } from '../types/health';

export function HealthCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    const data = await getHealthStatus();
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.success ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.success ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          Backend API Health
        </h3>
        <button
          onClick={fetchHealth}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/50">
          <span className="text-slate-400 block text-xs mb-1">Database (PostgreSQL)</span>
          <span className={`font-mono font-medium ${health?.data.services.database === 'connected' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {health?.data.services.database || 'Offline / Standby'}
          </span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/50">
          <span className="text-slate-400 block text-xs mb-1">Vector Extension (pgvector)</span>
          <span className={`font-mono font-medium ${health?.data.services.pgvector === 'installed' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {health?.data.services.pgvector || 'Offline / Standby'}
          </span>
        </div>
      </div>
    </div>
  );
}
