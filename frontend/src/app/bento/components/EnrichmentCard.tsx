"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Database, Sparkles, Brain, CheckCircle2 } from "lucide-react";

interface StudentDiagnostic {
  id: string;
  strength: string;
  gap: string;
  level: string;
  goal: string;
}

const DIAGNOSTICS: StudentDiagnostic[] = [
  { id: "student_101", strength: "Python, FastAPI", gap: "Vector Indexing", level: "Intermediate", goal: "AI Engineer" },
  { id: "student_102", strength: "React, Node.js", gap: "RAG Prompting", level: "Advanced", goal: "Full-Stack AI Lead" },
  { id: "student_103", strength: "C++, Data Structures", gap: "System Design", level: "Beginner", goal: "Software Engineer" },
];

export const EnrichmentCard: React.FC = () => {
  const [studentIdx, setStudentIdx] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-cycle through diagnostics every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setStudentIdx((prev) => (prev + 1) % DIAGNOSTICS.length);
      }, 500);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const curr = DIAGNOSTICS[studentIdx];

  return (
    <div className="relative w-full h-full bg-white text-slate-900 rounded-[32px] p-6 sm:p-8 border border-slate-200/80 shadow-lg flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-100 text-[11px] font-mono tracking-wider uppercase mb-3 font-semibold">
          <Brain className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
          <span>CREWAI DIAGNOSTICS ENGINE</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          AI Skill Profile Analysis
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          CrewAI agents evaluate assessment data to map strengths and skill gaps.
        </p>
      </div>

      {/* Input Display */}
      <div className="relative my-4">
        <div className="relative flex items-center">
          <Database className="absolute left-3.5 w-4 h-4 text-purple-600" />
          <div className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono flex items-center">
            <span>Analyzing ID: <strong className="text-purple-900">{curr.id}</strong></span>
          </div>
          <div className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-slate-950 text-white text-[11px] font-medium flex items-center gap-1 font-mono">
            {isAnalyzing ? (
              <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-3 h-3 text-purple-300" />
                <span>Running</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="min-h-[120px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={curr.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-3.5 rounded-2xl bg-[#F5F2FA] border border-purple-200 flex flex-col gap-2 font-mono text-xs shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="font-bold text-slate-900">Skill Profile Active</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                CrewAI Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1.5 border-t border-slate-200">
              <div>Strength: <span className="text-emerald-700 font-bold">{curr.strength}</span></div>
              <div>Skill Gap: <span className="text-rose-600 font-bold">{curr.gap}</span></div>
              <div>Level: <span className="text-purple-700 font-bold">{curr.level}</span></div>
              <div>Target Goal: <span className="text-slate-900 font-bold">{curr.goal}</span></div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Tags */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
        <span className="px-2 py-0.5 rounded bg-slate-100">Assessment</span>
        <span className="px-2 py-0.5 rounded bg-slate-100">Strengths</span>
        <span className="px-2 py-0.5 rounded bg-slate-100">Gap Matrix</span>
      </div>
    </div>
  );
};
