"use client";

import React from "react";
import { motion } from "framer-motion";

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full bg-gradient-to-b from-[#F5F2FA] via-[#DECFF3] to-[#B59DE1] text-slate-950 pt-20 pb-0 overflow-hidden font-mono selection:bg-slate-950 selection:text-white">
      {/* Signature Luminous Purple Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-t from-[#8B5CF6]/35 via-[#A78BFA]/25 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-10">
        {/* Top Multi-Column Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 pb-20 text-[11px] font-mono uppercase tracking-wider">
          {/* Col 1: Architecture Services */}
          <div className="flex flex-col gap-3">
            <span className="text-slate-500 font-normal">Services</span>
            <ul className="space-y-2 text-slate-700 font-semibold">
              <li><a href="#architecture" className="hover:text-slate-950 transition-colors">Main Backend (Node)</a></li>
              <li><a href="#architecture" className="hover:text-slate-950 transition-colors">AI Service (FastAPI)</a></li>
              <li><a href="#architecture" className="hover:text-slate-950 transition-colors">CrewAI Agents</a></li>
              <li><a href="#architecture" className="hover:text-slate-950 transition-colors">Qdrant Vector DB</a></li>
            </ul>
          </div>

          {/* Col 2: Learning Capabilities */}
          <div className="flex flex-col gap-3">
            <span className="text-slate-500 font-normal">Capabilities</span>
            <ul className="space-y-2 text-slate-700 font-semibold">
              <li><a href="#how-it-works" className="hover:text-slate-950 transition-colors">Skill Assessments</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-950 transition-colors">RAG Roadmaps</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-950 transition-colors">AI Assistant</a></li>
              <li><a href="#how-it-works" className="hover:text-slate-950 transition-colors">Human Mentors</a></li>
            </ul>
          </div>

          {/* Col 3: System */}
          <div className="flex flex-col gap-3">
            <span className="text-slate-500 font-normal">Platform</span>
            <ul className="space-y-2 text-slate-950 font-bold">
              <li><a href="#hero-section-root" className="hover:opacity-75 transition-opacity">Overview</a></li>
              <li><a href="#how-it-works" className="hover:opacity-75 transition-opacity">Learning Flow</a></li>
              <li><a href="#capabilities" className="hover:opacity-75 transition-opacity">Bento Features</a></li>
              <li><a href="#architecture" className="hover:opacity-75 transition-opacity">Architecture Doc</a></li>
            </ul>
          </div>

          {/* Col 4 - 6: Tech Stack Badges */}
          <div className="col-span-2 lg:col-span-3 flex flex-wrap items-start justify-between gap-6 pt-2 md:pt-0">
            <span className="text-slate-950 font-bold">Node.js + Express</span>
            <span className="text-slate-950 font-bold">Python + FastAPI</span>
            <span className="text-slate-950 font-bold">CrewAI + Gemini</span>
            <span className="text-slate-950 font-bold">Qdrant Vector DB</span>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-12 text-[11px] font-mono text-slate-700 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-950 text-white flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            © {new Date().getFullYear()} LEARN AI PLATFORM. ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center gap-8 text-slate-950 font-bold">
            <span>2-MICROSERVICE ARCHITECTURE</span>
            <span>HUMAN-IN-THE-LOOP MENTORSHIP</span>
          </div>
        </div>
      </div>

      {/* Massive Geometric Watermark */}
      <div className="relative z-10 w-full overflow-hidden leading-none select-none pointer-events-none pt-4 pb-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="w-full flex justify-center items-center"
        >
          <h1 className="text-[13vw] font-black tracking-[-0.08em] text-slate-950 text-center leading-[0.72] uppercase font-mono w-full drop-shadow-sm scale-y-110">
            LEARN AI
          </h1>
        </motion.div>
      </div>
    </footer>
  );
};
