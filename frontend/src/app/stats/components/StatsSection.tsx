"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, Sparkles, UserCheck, Activity } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import { ConversionChart } from "./ConversionChart";
import { RevenueChart } from "./RevenueChart";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const StatsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const [assessmentsCount, setAssessmentsCount] = useState(4920);
  const [roadmapsCount, setRoadmapsCount] = useState(640);

  // Live micro-tick counter animation that updates numbers live
  useEffect(() => {
    const timer = setInterval(() => {
      setAssessmentsCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.5) {
        setRoadmapsCount((prev) => prev + 1);
      }
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  useGSAP(
    () => {
      if (!cardsRef.current) return;

      gsap.fromTo(
        cardsRef.current.children,
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F5F2FA] py-24 border-t border-slate-200/60 overflow-hidden"
    >
      <div className="relative w-full max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 text-white border border-slate-800 text-xs font-bold font-mono tracking-wider uppercase mb-4 shadow-sm">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>SEEKH AI LEARNING IMPACT</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.15]">
            Empirical Results: <span className="font-bold text-purple-900">Adaptive Skill Growth</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed max-w-2xl">
            Real-time metrics demonstrating how Seekh AI assessment diagnostics and Qdrant RAG roadmaps accelerate student skill mastery.
          </p>
        </div>

        {/* 4 Animated Counter Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-lg flex flex-col justify-between group hover:border-purple-400 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-600">Assessments Analyzed</span>
              <Zap className="w-4 h-4 text-purple-600 animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
              <AnimatedCounter value={assessmentsCount} suffix="+" />
            </div>
            <span className="text-[11px] text-purple-700 font-mono font-bold mt-2 flex items-center gap-1">
              <Activity className="w-3 h-3 text-purple-600 animate-spin-slow" />
              <span>CrewAI + Gemini Live</span>
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-[28px] bg-[#D8CBEB] border border-white/60 shadow-lg flex flex-col justify-between group hover:border-purple-500 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-700 mb-2">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-900">Personalized Roadmaps</span>
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
              <AnimatedCounter value={roadmapsCount} suffix="+" />
            </div>
            <span className="text-[11px] text-slate-900 font-mono font-bold mt-2">
              Qdrant RAG Resource Retrieval
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-[28px] bg-white border border-slate-200/80 shadow-lg flex flex-col justify-between group hover:border-purple-400 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-600">Skill Mastery Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 animate-bounce" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
              <AnimatedCounter value={94.8} decimals={1} suffix="%" />
            </div>
            <span className="text-[11px] text-emerald-600 font-mono font-bold mt-2">
              Verified by Human Mentors
            </span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-6 rounded-[28px] bg-[#1E192B] text-white border border-white/20 shadow-lg flex flex-col justify-between group hover:border-purple-400 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between text-white/50 mb-2">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-purple-300">Human Mentor Feedback</span>
              <UserCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
              &lt; 2 hrs
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-bold mt-2">
              Avg Mentor Review Turnaround
            </span>
          </motion.div>
        </div>

        {/* 2 Recharts Interactive Visual Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <div className="p-6 sm:p-8 rounded-[36px] bg-[#1E192B] text-white border border-white/20 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold block mb-1">
                  Task Completion Velocity
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Monthly Student Skill Progress
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C4B5FD] animate-pulse" />
                  <span>Tasks</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Mastery</span>
                </span>
              </div>
            </div>

            <ConversionChart />
          </div>

          {/* Chart 2 */}
          <div className="p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-700 font-bold block mb-1">
                  Learning Efficiency
                </span>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  Time-to-Mastery Acceleration
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                3.5x Faster Mastery
              </span>
            </div>

            <RevenueChart />
          </div>
        </div>
      </div>
    </section>
  );
};
