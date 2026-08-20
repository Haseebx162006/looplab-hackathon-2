"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUpRight, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface SubmissionItem {
  id: number;
  student: string;
  task: string;
  module: string;
  score: string;
  status: "Approved" | "Needs Improvement" | "In Review";
  avatar: string;
}

const SUBMISSIONS_DATA: SubmissionItem[] = [
  { id: 1, student: "Hasan Raza", task: "Binary Search Tree Implementation", module: "DSA & Problem Solving", score: "98/100", status: "Approved", avatar: "HA" },
  { id: 2, student: "Zainab Omar", task: "FastAPI REST Vector Endpoint", module: "Web & Backend Dev", score: "Reviewing", status: "In Review", avatar: "ZO" },
  { id: 3, student: "Usman Khan", task: "Qdrant RAG Prompt Engineering", module: "AI & Machine Learning", score: "82/100", status: "Needs Improvement", avatar: "UK" },
  { id: 4, student: "Ayesha Malik", task: "CrewAI Multi-Agent Evaluator", module: "AI & Machine Learning", score: "95/100", status: "Approved", avatar: "AM" },
];

const FILTERS = ["All", "Approved", "In Review"];

export const PipelineFeedCard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [filterIdx, setFilterIdx] = useState(0);

  // Auto-cycle through filters automatically every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFilterIdx((prev) => {
        const next = (prev + 1) % FILTERS.length;
        setActiveFilter(FILTERS[next]);
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const filtered = SUBMISSIONS_DATA.filter((s) => activeFilter === "All" || s.status === activeFilter);

  return (
    <div className="relative w-full h-full bg-[#1E192B] text-white rounded-[32px] p-6 sm:p-8 border border-white/20 shadow-lg flex flex-col justify-between overflow-hidden group transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-300 text-[11px] font-mono tracking-wider uppercase mb-3">
            <Activity className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>LIVE AUTOMATED QUEUE</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Task Submissions & Mentor Queue
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${activeFilter === tab
                ? "bg-[#D8CBEB] text-slate-950 font-bold shadow"
                : "text-white/60 hover:text-white"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stream List */}
      <div className="my-5 space-y-2.5 min-h-[200px]">
        <AnimatePresence mode="wait">
          {filtered.slice(0, 3).map((item) => (
            <motion.div
              key={`${activeFilter}-${item.id}`}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4 hover:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D8CBEB] text-slate-950 font-bold text-xs flex items-center justify-center shadow">
                  {item.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{item.student}</span>
                    <span className="text-[10px] text-purple-300 font-mono">[{item.module}]</span>
                  </div>
                  <span className="text-xs text-white/70">{item.task}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-purple-300">{item.score}</div>
                <div className={`text-[10px] flex items-center justify-end gap-1 font-mono ${item.status === "Approved" ? "text-emerald-400" : item.status === "In Review" ? "text-amber-300" : "text-rose-400"
                  }`}>
                  {item.status === "Approved" ? (
                    <CheckCircle2 className="w-3 h-3 animate-pulse" />
                  ) : item.status === "In Review" ? (
                    <Clock className="w-3 h-3 animate-spin-slow" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>{item.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Metric */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/60 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Auto-Syncing Submissions Live</span>
        </div>
        <div className="flex items-center gap-1 text-purple-300 font-semibold cursor-pointer">
          <span>Live Queue</span>
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
