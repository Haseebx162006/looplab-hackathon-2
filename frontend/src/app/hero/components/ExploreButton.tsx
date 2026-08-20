"use client";

import React from "react";
import { Zap, Sparkles } from "lucide-react";

export const ExploreButton: React.FC = () => {
  return (
    <div className="glass-pill px-5 py-2.5 rounded-full flex items-center gap-2.5 text-xs font-semibold font-mono tracking-wider text-slate-800 bg-white/60 backdrop-blur-md shadow-sm border border-white/80">
      <div className="relative flex items-center justify-center">
        <Zap className="w-4 h-4 text-purple-700 animate-pulse fill-purple-700/20" />
      </div>
      <span>SEEKH AI ENGINE</span>
    </div>
  );
};
