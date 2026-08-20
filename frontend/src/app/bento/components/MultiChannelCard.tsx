"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Code, Lightbulb, BookOpen, Send, Check } from "lucide-react";

interface AssistanceOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  confidence: string;
  preview: string;
}

const MODES: AssistanceOption[] = [
  {
    id: "explain",
    name: "Code Explainer",
    icon: <Code className="w-4 h-4 text-purple-700" />,
    confidence: "99.2%",
    preview: "Binary Search Tree insert helper utilizes recursion to traverse left/right child nodes until a null spot is found.",
  },
  {
    id: "hints",
    name: "Hints & Tips",
    icon: <Lightbulb className="w-4 h-4 text-amber-700" />,
    confidence: "96.4%",
    preview: "Hint: Check edge case when the root node is null before accessing root.val to prevent NullPointerException.",
  },
  {
    id: "resources",
    name: "Qdrant Docs",
    icon: <BookOpen className="w-4 h-4 text-emerald-700" />,
    confidence: "98.7%",
    preview: "Retrieved 3 vector chunks from Python Data Structures Guide (cosine similarity score: 0.941).",
  },
];

export const MultiChannelCard: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string>("explain");
  const [copied, setCopied] = useState(false);

  // Auto-cycle through assistance modes automatically every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedMode((prev) => {
        const currIdx = MODES.findIndex((m) => m.id === prev);
        const nextIdx = (currIdx + 1) % MODES.length;
        return MODES[nextIdx].id;
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const active = MODES.find((c) => c.id === selectedMode) || MODES[0];

  return (
    <div className="relative w-full h-full bg-[#D8CBEB] text-slate-900 rounded-[32px] p-6 sm:p-8 border border-white/60 shadow-lg flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-purple-200 text-purple-950 text-[11px] font-mono tracking-wider uppercase mb-3 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-purple-700 animate-spin-slow" />
          <span>FASTAPI + QDRANT RAG</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          AI Learning Assistant
        </h3>
        <p className="text-xs text-slate-700 mt-1">
          Instant contextual help, hints, and explanations while working on tasks.
        </p>

        {/* Mode Selector Pills */}
        <div className="grid grid-cols-3 gap-2 mt-5 p-1.5 bg-white/60 rounded-2xl border border-white/80">
          {MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected ? "bg-slate-950 text-white shadow-md" : "text-slate-700 hover:bg-white/40"
                }`}
              >
                <span>{mode.icon}</span>
                <span className="hidden sm:inline">{mode.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content Preview Box */}
      <div className="my-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-white border border-white/80 text-slate-900 font-mono text-xs flex flex-col gap-2.5 shadow-sm"
          >
            <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-2">
              <span className="text-purple-900 font-bold flex items-center gap-1.5">
                {active.icon}
                {active.name}
              </span>
              <span className="text-emerald-700 font-bold">{active.confidence} RAG Match</span>
            </div>

            <p className="text-slate-700 leading-relaxed font-sans text-xs italic">
              "{active.preview}"
            </p>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
              <span>Vector DB: <span className="text-slate-900 font-bold">Qdrant</span></span>
              <span>LLM: <span className="text-purple-900 font-bold">Gemini 2.5</span></span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action Button */}
      <div className="w-full py-3 rounded-2xl bg-slate-950 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow transition-colors font-mono">
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>AI Response Generated Automatically</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4 text-purple-300 animate-bounce" />
            <span>Processing Live RAG Inquiry...</span>
          </>
        )}
      </div>
    </div>
  );
};
