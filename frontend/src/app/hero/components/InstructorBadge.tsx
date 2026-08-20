"use client";

import React from "react";
import { UserCheck, ShieldCheck } from "lucide-react";

export const InstructorBadge: React.FC = () => {
  return (
    <div className="glass-pill px-4 py-2 rounded-full flex items-center gap-3 shadow-md bg-white/80 backdrop-blur-md border border-white/80">
      <div className="flex -space-x-2">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
          alt="Mentor 1"
          className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs"
        />
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
          alt="Mentor 2"
          className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-xs"
        />
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1 font-mono">
          Human Senior Mentors <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
        </span>
        <span className="text-[10px] text-slate-600 font-sans">
          Real experts reviewing task submissions 1:1
        </span>
      </div>
    </div>
  );
};
