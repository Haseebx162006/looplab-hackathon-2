"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export const WhyChooseSection: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 text-slate-900 border-t border-slate-200/60 mt-4">
      {/* Left Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide uppercase">
          WHY CHOOSE OUR <br />
          <span className="font-semibold text-purple-900">AI LEARNING PLATFORM?</span>
        </h2>
      </div>

      {/* Center Highlight Pill */}
      <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-sm border border-slate-200">
        <span className="text-sm font-light tracking-wide text-slate-900">
          CrewAI + Gemini + <span className="font-bold text-purple-700">Qdrant RAG</span>
        </span>
        <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-700" />
          <span>HUMAN REVIEW</span>
        </div>
      </div>

      {/* Right Description Text */}
      <p className="text-xs sm:text-sm text-slate-600 max-w-sm font-normal leading-relaxed">
        Experience adaptive skill profiling, custom-retrieved learning roadmaps, and real human mentor guidance to achieve 100% mastery.
      </p>
    </section>
  );
};
