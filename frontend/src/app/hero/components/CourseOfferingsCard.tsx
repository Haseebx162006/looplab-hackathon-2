"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export const CourseOfferingsCard: React.FC = () => {
  const [selected, setSelected] = useState<number>(0);

  const modules = [
    { title: "Adaptive Skill Assessment", type: "line" },
    { title: "RAG Roadmap Generator", type: "circle" },
    { title: "Human Mentor Feedback Loop", type: "circle" },
  ];

  return (
    <div className="glass-card w-64 sm:w-72 p-4 rounded-3xl flex flex-col gap-3 transition-transform duration-300 hover:scale-[1.02] shadow-xl border border-white/80">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase font-mono">
          LEARNING PLATFORM
        </span>
        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
          <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>

      {/* Module List */}
      <div className="flex flex-col gap-2 my-1">
        {modules.map((m, idx) => (
          <div
            key={m.title}
            onClick={() => setSelected(idx)}
            className={`flex items-center gap-2.5 text-xs font-medium cursor-pointer transition-colors ${
              selected === idx ? "text-slate-950 font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {selected === idx ? (
              <span className="h-4 w-1 bg-purple-700 rounded-full" />
            ) : (
              <span className="w-2 h-2 rounded-full border border-slate-700" />
            )}
            <span>{m.title}</span>
          </div>
        ))}
      </div>

      {/* Visual Preview */}
      <div className="relative w-full h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-200 via-indigo-100 to-purple-300 border border-white/60 flex items-center justify-center group">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-xs" />
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-400/50 to-indigo-400/50 blur-md animate-spin-slow group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-[10px] font-mono font-bold text-purple-950 border border-purple-200">
          Qdrant RAG Connected
        </div>
      </div>
    </div>
  );
};
