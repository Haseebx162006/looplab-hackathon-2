"use client";

import React from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

export const HeroHeadline: React.FC = () => {
  return (
    <div className="max-w-xl flex flex-col items-start gap-4">
      {/* Decorative arrow & headline */}
      <div className="relative pt-2">
        <svg
          className="absolute -left-16 -top-4 w-16 h-12 text-slate-800 hidden sm:block"
          viewBox="0 0 70 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M 5 35 Q 35 10, 60 20"
            strokeDasharray="4 3"
          />
          <path d="M 52 14 L 62 20 L 56 28" />
        </svg>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-slate-900 leading-[1.1] tracking-tight">
          Seekh AI <br />
          <span className="font-normal">Personalized</span> <br />
          <span className="font-normal">Learning </span>
          <span className="inline-block align-middle ml-1">
            <Sparkles className="w-8 h-8 text-purple-700 animate-spin-slow inline" />
          </span>
        </h1>
      </div>

      <p className="text-sm sm:text-base text-slate-700 font-normal max-w-md mt-1 leading-relaxed">
        Adaptive Skill Diagnostics, RAG-Powered Custom Roadmaps, and Real Human Mentor Feedback.
      </p>

      {/* Action Button */}
      <button
        onClick={() => {
          document.querySelector("#how-it-works")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="mt-3 px-6 py-3 rounded-full bg-slate-950 text-white font-medium text-xs tracking-wider flex items-center gap-3 shadow-lg hover:bg-purple-900 transition-all duration-300 group cursor-pointer"
      >
        <span>START LEARNING</span>
        <div className="w-6 h-6 rounded-full bg-white text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </button>
    </div>
  );
};
