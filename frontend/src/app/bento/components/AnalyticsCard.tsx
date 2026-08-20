"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Zap } from "lucide-react";

const METRICS_LIST = ["tasks", "roadmaps", "mastery"] as const;

export const AnalyticsCard: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<"tasks" | "roadmaps" | "mastery">("tasks");
  const [barPhase, setBarPhase] = useState(0);

  // Auto-cycle through metrics every 3 seconds & shift bars
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMetric((prev) => {
        const currIdx = METRICS_LIST.indexOf(prev);
        return METRICS_LIST[(currIdx + 1) % METRICS_LIST.length];
      });
      setBarPhase((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const metrics = {
    tasks: { val: "2,490+", sub: "Reviewed by Human Mentors", label: "Completed Student Tasks", bars: [40, 65, 50, 85, 70, 95, 100] },
    roadmaps: { val: "640+", sub: "Curated via Qdrant RAG", label: "Personalized AI Roadmaps", bars: [55, 75, 60, 90, 80, 88, 98] },
    mastery: { val: "94.8%", sub: "Skill Diagnostic Pass Rate", label: "Student Skill Mastery", bars: [70, 80, 85, 90, 92, 96, 100] },
  };

  const curr = metrics[activeMetric];

  return (
    <div className="relative w-full h-full bg-[#D8CBEB] text-slate-900 rounded-[32px] p-6 sm:p-8 border border-white/60 shadow-lg flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-purple-200 text-purple-950 text-[11px] font-mono tracking-wider uppercase mb-3 font-bold">
          <TrendingUp className="w-3.5 h-3.5 text-purple-700 animate-pulse" />
          <span>LEARNING ANALYTICS</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Student Progress
        </h3>
      </div>

      {/* Metric Selector Pills */}
      <div className="flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-white/80 my-3">
        {METRICS_LIST.map((m) => (
          <button
            key={m}
            onClick={() => setActiveMetric(m)}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activeMetric === m
                ? "bg-slate-950 text-white shadow"
                : "text-slate-700 hover:bg-white/40"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Display Value */}
      <div className="my-1">
        <motion.div
          key={activeMetric}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col"
        >
          <span className="text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
            {curr.val}
          </span>
          <span className="text-xs text-purple-900 font-mono font-bold mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-700 animate-bounce" />
            {curr.sub}
          </span>
          <span className="text-[11px] text-slate-600 mt-0.5">{curr.label}</span>
        </motion.div>
      </div>

      {/* Bar Chart Graphic */}
      <div className="flex items-end gap-1.5 h-12 w-full pt-1">
        {curr.bars.map((h, i) => (
          <motion.div
            key={`${activeMetric}-${i}`}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`flex-1 rounded-t-md transition-all ${
              i === 6 ? "bg-slate-950 shadow-md" : "bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
